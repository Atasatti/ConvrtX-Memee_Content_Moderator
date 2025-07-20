from openai import OpenAI
from app.settings import settings

class TextModerationService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)

    def __get_moderation_prompt(self):
        prompt = """
You are a text moderation system. Analyze the input text and determine if it violates any of the moderation rules below. Return `True` if the text is inappropriate or violates the rules (not good), and return `False` if the text is appropriate (good).  

### **Moderation Rules:**  
    1. **Profanity and Hate Speech:** Flag content containing offensive language, slurs, or hate speech targeting any individual or group based on race, ethnicity, gender, sexual orientation, religion, or disability.  
    2. **Violence and Threats:** Flag descriptions of violence, threats of harm, or promotion of illegal activities.  
    3. **Sexually Explicit Content:** Flag content with explicit, suggestive, or sexually inappropriate language.  
    4. **Misinformation:** Flag unverified, misleading, or harmful claims, especially those affecting health, safety, or security.  
    5. **Harassment or Cyberbullying:** Flag abusive or targeted harassment language.  
    6. **Sensitive Information:** Flag content containing private or sensitive personal data such as phone numbers, addresses, or financial information.  
    7. **Spam or Irrelevance:** Flag spam, phishing attempts, or irrelevant disruptive content.  

### **Output:** 
# 
    - Return {"status" : True} if the text violates any of these rules.  
    - Return {"status" : False} if the text is appropriate and does not violate any rules.  

### Rules:
    - Ensure high accuracy and avoid false positives by considering context and intent.    
    - Return the output in JSON format. 
    - Donot add 'json' in response.
    - Return either True or False in status
    - Donot add any other text in response
    - Donot add any other key in response
    - Donot add 0 or 1 in response.
    """
        return prompt

    def moderate_text(self, text: str) -> bool:
        prompt = self.__get_moderation_prompt()

        response = self.client.moderations.create(
            model = "omni-moderation-latest",
            input = text,
        )
    
        return response

