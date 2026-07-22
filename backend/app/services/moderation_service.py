import ast
import json
from fastapi.responses import JSONResponse
from .utils import TextModerationService
from .utils.get_number_from_text import GPTNumberCheckService


text_moderation = TextModerationService()
GPT_number_check = GPTNumberCheckService()

async def analyze_text(text: str) -> JSONResponse:
    """
    Analyze text for content moderation.
    
    Args:
        text (str): The text to be analyzed
        
    Returns:
        JSONResponse: Contains:
            - flagged (bool): Whether the text was flagged
            - category_scores (dict[str, float]): Scores for each category (0-1)
            
    Raises:
        Exception: If moderation service fails
    """
    try:    
        response = text_moderation.moderate_text(text)

        # Check for more than 5 digits
        digits_count = sum(c.isdigit() for c in text)
        
        flag = False
        numbers = []

        if digits_count > 5:
            response_number = await GPT_number_check.detect_mobile_number_with_gpt(text)
        
            # Extract content and clean it up before parsing
            response_content = response_number.choices[0].message.content.strip()

            try:
                parsed_response = json.loads(response_content)
                flag = parsed_response.get("flag", False)
                numbers = parsed_response.get("numbers", [])
            except json.JSONDecodeError as json_err:
                print(f"JSON parsing error: {json_err}")
                # Continue with default values for flag and numbers

        category_scores = dict(response.results[0].category_scores)
        category_type = max(category_scores, key=category_scores.get)
        
        threshold = 0.75

        # Check if any score is above the threshold and set the 'flagged' status accordingly
        flagged = any(score > threshold for score in category_scores.values()) if isinstance(category_scores, dict) else any(score > threshold for score in category_scores)

        return JSONResponse(
            content={
                "flagged": bool(flagged) or flag,
                "type": category_type,
                "category_scores": category_scores,
                "numbers": numbers,
            },
            status_code=200
        )
    
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )
    
