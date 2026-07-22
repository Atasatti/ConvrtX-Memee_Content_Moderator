from openai import OpenAI
from pathlib import Path
from app.settings import settings

class GPTNumberCheckService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    async def detect_mobile_number_with_gpt(self, text):
        prompt = (
            f"Detect any phone numbers in the following text. "
            f"Respond with a JSON object containing 'flag' (True if any numbers are detected, False otherwise) "
            f"and 'numbers' (a list of detected phone numbers):\n\n{text}"
        )
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an assistant that extracts phone numbers."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.2
            )
            # print(response)
            return response
        except Exception as e:
            raise Exception(f"Failed to Check number: {str(e)}")



