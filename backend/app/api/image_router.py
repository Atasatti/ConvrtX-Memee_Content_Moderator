import tensorflow as tf
import numpy as np
from fastapi import APIRouter, HTTPException, File, UploadFile
from io import BytesIO
import logging
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from ..services import analyze_text
import easyocr
import json

# Configure logging
logging.basicConfig(level=logging.INFO)

# Create router
image_router = APIRouter(prefix="/image", tags=["Image"])

# Define image categories
image_categories = ['drawings', 'hentai', 'neutral', 'porn', 'sexy']

# Load the model
try:
    image_model = tf.keras.models.load_model(
        r"..\nsfw_model\nsfw.299x299.h5",
        compile=False,
        custom_objects={'Adam': tf.keras.optimizers.legacy.Adam}
    )
except Exception as e:
    logging.error(f"Failed to load model: {e}")
    raise RuntimeError("Failed to initialize image model")

@image_router.post("/predict")
async def predict_image(file: UploadFile = File(...)):

    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Load and preprocess the image
        contents = await file.read()

        img = load_img(BytesIO(contents), target_size=(299, 299))
        img_array = img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Make prediction
        predictions = image_model.predict(img_array, verbose=0)
        prediction_probs = predictions[0]
        
        # Convert prediction results to Python floats
        result = {image_categories[i]: float(prediction_probs[i]) for i in range(len(image_categories))}
        top_category = image_categories[np.argmax(prediction_probs)]
        
        flag = False
        numbers = []
        type = None
        category_scores = []

        
        try:            
            # Initialize EasyOCR
            reader = easyocr.Reader(['en'])
            
            # Process the image from memory
            text = reader.readtext(contents, detail=0)  # `detail=0` returns just the text
            print("Extracted Text:", text)
            
            text_analysis_result = await analyze_text(text)
            # return result

            try:
                parsed_response = json.loads(text_analysis_result.body)
                flag = parsed_response.get("flag", False)
                numbers = parsed_response.get("numbers", [])
                type = parsed_response.get("type", None)
                category_scores = parsed_response.get("category_scores", [])

            except json.JSONDecodeError as json_err:
                print(f"JSON parsing error: {json_err}")
                # Continue with default values for flag and numbers
        
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logging.error(f"Error processing image text: {e}")
            raise HTTPException(status_code=500, detail="Internal server error") 

        return {
            "image_classification": {
                "predictions": result,
                "top_category": top_category
            },
            "text_analysis": {
                "flag": flag,
                "numbers": numbers,
                "type": type,
                "category_scores": category_scores
            }
        }    
    except Exception as e:
        # Log the error and raise HTTPException
        logging.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Error processing the image.")




@image_router.post("/check_text")
async def check_image_text(file: UploadFile = File(...)):
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Initialize EasyOCR
        reader = easyocr.Reader(['en'])
        
        # Process the image from memory
        text = reader.readtext(contents, detail=0)  # `detail=0` returns just the text
        print("Extracted Text:", text)
        
        result = await analyze_text(text)
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error processing image text: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")