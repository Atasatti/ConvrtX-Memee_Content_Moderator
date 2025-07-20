from fastapi import APIRouter, HTTPException, File, UploadFile
from io import BytesIO
import logging
import av
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import img_to_array
import cv2
from ..services import transcribe_audio_file
import json


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

# Create the router
video_router = APIRouter(prefix="/video", tags=["video"])


@video_router.post("/analyze_video")
async def analyze_video(file: UploadFile = File(...)):
    try:
        # Validate file extension
        if not file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.wmv')):
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload a valid video file."
            )

        # Read video file into memory
        contents = await file.read()
        video_stream = BytesIO(contents)

        # Analyze video frames using PyAV
        container = av.open(video_stream)
        results = []
        top_categories = []
        frame_rate = 1  # Process 1 frame per second
        fps = container.streams.video[0].average_rate
        interval = int(fps) if fps > 0 else 1

        for frame_index, frame in enumerate(container.decode(video=0)):
            if frame_index % (interval * frame_rate) == 0:
                # Convert frame to RGB format
                frame_rgb = frame.to_ndarray(format="rgb24")

                # Resize and preprocess the frame
                frame_resized = cv2.resize(frame_rgb, (299, 299))
                img_array = img_to_array(frame_resized) / 255.0
                img_array = np.expand_dims(img_array, axis=0)

                # Make prediction
                predictions = image_model.predict(img_array, verbose=0)
                prediction_probs = predictions[0]

                result = {image_categories[i]: float(prediction_probs[i]) for i in range(len(image_categories))}
                top_category = image_categories[np.argmax(prediction_probs)]

                results.append(result)
                top_categories.append(top_category)

        # # Process and transcribe audio
        # chunks = process_audio(contents)  # Use your existing process_audio function
        # transcripts = []
        # for i, chunk in enumerate(chunks):
        #     chunk.name = file.filename  # Set the filename attribute for compatibility
        #     transcript = await transcribe_audio_file(chunk, file.filename)
        #     transcripts.append(transcript)
    
        # # Combine all transcripts into a single string
        # full_transcription = "".join(transcripts)

        full_transcription = await transcribe_audio_file(contents, file.filename)

        try:
            parsed_response = json.loads(full_transcription.body)
            flagged = parsed_response.get("flagged", False)
            numbers = parsed_response.get("numbers", [])
            type = parsed_response.get("type", None)
            category_scores = parsed_response.get("category_scores", [])

        except json.JSONDecodeError as json_err:
            print(f"JSON parsing error: {json_err}")



        return {
             "Frames_classification": {
                "predictions": results,
                "top_categories": top_categories,
                "frame_count": len(top_categories),
            },

            "Audio_analysis": {
                "flagged": flagged,
                "numbers": numbers,
                "type": type,
                "category_scores": category_scores
            }

        }

    except Exception as e:
        logging.error(f"Error processing video: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing the video: {str(e)}"
        )
