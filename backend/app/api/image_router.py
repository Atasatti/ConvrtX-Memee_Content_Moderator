import os
import tensorflow as tf
import numpy as np
from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
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
    # Absolute path to the model so the app runs from any working directory
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(BASE_DIR, "nsfw_model", "nsfw.299x299.h5")

    image_model = tf.keras.models.load_model(
        model_path,
        compile=False,
        custom_objects={'Adam': tf.keras.optimizers.legacy.Adam}
    )
except Exception as e:
    logging.error(f"Failed to load model: {e}")
    raise RuntimeError("Failed to initialize image model")

# EasyOCR loads its detection/recognition weights on construction, so build it
# once and reuse it instead of paying that cost on every request.
_ocr_reader = None


def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        _ocr_reader = easyocr.Reader(['en'])
    return _ocr_reader


def extract_image_text(contents: bytes) -> str:
    """Run OCR and return the detected text as a single string.

    `readtext(detail=0)` yields one string per detected box; analyze_text expects
    a single string, so join them here rather than passing the list through.
    """
    chunks = get_ocr_reader().readtext(contents, detail=0)
    return " ".join(chunks)


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
        text = ""


        try:
            # Process the image from memory
            text = extract_image_text(contents)
            print("Extracted Text:", text)

            text_analysis_result = await analyze_text(text)

            try:
                parsed_response = json.loads(text_analysis_result.body)
                # analyze_text returns "flagged"; keep "flag" as a fallback.
                flag = parsed_response.get("flagged", parsed_response.get("flag", False))
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
                "flagged": flag,
                "flag": flag,  # retained for backwards compatibility
                "numbers": numbers,
                "type": type,
                "category_scores": category_scores,
                # Return what OCR actually read, so callers can see what the
                # verdict was based on rather than trusting it blindly.
                "extracted_text": text
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

        # Process the image from memory
        text = extract_image_text(contents)
        print("Extracted Text:", text)

        result = await analyze_text(text)

        # Fold the OCR output into the moderation payload so callers can see the
        # text the verdict was based on. Preserve the original status code —
        # analyze_text signals its own failures with a 500.
        try:
            payload = json.loads(result.body)
            payload["extracted_text"] = text
            return JSONResponse(content=payload, status_code=result.status_code)
        except json.JSONDecodeError:
            return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error processing image text: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")