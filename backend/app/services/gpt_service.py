import ast
from fastapi.responses import JSONResponse
from .utils.get_number_from_text import GPTNumberCheckService
import json

GPT_number_check = GPTNumberCheckService()

async def check_number(text: str) -> JSONResponse:
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
        response = await GPT_number_check.detect_mobile_number_with_gpt(text)
        
        # Extract content and clean it up before parsing
        response_content = response.choices[0].message.content.strip()
        
        # Add error handling for JSON parsing
        try:
            parsed_response = json.loads(response_content)
        except json.JSONDecodeError as json_err:
            return {
                "flagged": False,
                "numbers": [],
            }

        flag = parsed_response.get("flag", False)
        numbers = parsed_response.get("numbers", [])

        return {
            "flagged": flag,
            "numbers": numbers
        }
    except Exception as e:
        raise Exception(f"Error processing text: {str(e)}")
    
