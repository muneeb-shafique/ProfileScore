import os
import json
from flask import Flask, render_template, request, jsonify
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyB4cRUl49nlPbgXnSXwSjg2kHdhU4pvU2I"))
generation_config = {
  "temperature": 0.7,
  "max_output_tokens": 4000,
}
model = genai.GenerativeModel('gemini-3.1-flash-lite', generation_config=generation_config)

def scrape_linkedin_profile(url):
    try:
        # Googlebot User-Agent often bypasses some basic auth walls on LinkedIn for public profiles
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        
        # We will also use a requests session
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Public profiles usually have content inside main or sections
        # Try to find the main content block
        main_content = soup.find('main')
        if main_content:
            text = main_content.get_text(separator=' | ', strip=True)
        else:
            text = soup.get_text(separator=' | ', strip=True)
            
        # LinkedIn also stores structured data in <script type="application/ld+json">
        ld_json = soup.find('script', type='application/ld+json')
        if ld_json:
            text += "\n\nStructured Data Context: " + ld_json.get_text()

        # If it hits the authwall, it usually contains "authwall" or "Sign In" prominently
        if "authwall" in response.url.lower() or len(text) < 300:
            return None, "LinkedIn security blocked the request. Please use Manual Entry."
            
        return text, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    profile_context = ""
    
    if data.get('type') == 'url':
        url = data.get('content')
        if not url:
            return jsonify({'error': 'URL is required'}), 400
            
        scraped_text, error = scrape_linkedin_profile(url)
        
        if error:
            return jsonify({'error': f'Scraping failed: {error}'}), 400
            
        profile_context = f"Raw Scraped LinkedIn Data:\n{scraped_text}"
        
    elif data.get('type') == 'manual':
        content = data.get('content', {})
        profile_context = f"""
        Headline: {content.get('headline', '')}
        Summary: {content.get('summary', '')}
        Experience: {content.get('experience', '')}
        Skills: {content.get('skills', '')}
        Education: {content.get('education', '')}
        """
    elif data.get('type') == 'html':
        raw_html = data.get('content')
        if not raw_html:
            return jsonify({'error': 'HTML content is required'}), 400
            
        soup = BeautifulSoup(raw_html, 'html.parser')
        
        main_content = soup.find('main')
        if main_content:
            text = main_content.get_text(separator=' | ', strip=True)
        else:
            text = soup.get_text(separator=' | ', strip=True)
            
        ld_jsons = soup.find_all('script', type='application/ld+json')
        for ld in ld_jsons:
            text += "\n\nStructured Data Context: " + ld.get_text()
            
        profile_context = f"Raw Scraped LinkedIn Data from HTML:\n{text[:40000]}"
    else:
        return jsonify({'error': 'Invalid input type'}), 400

    prompt = f"""
    You are an elite LinkedIn profile reviewer and executive career coach.
    I will provide you with the text of a LinkedIn profile (either structured or raw scraped text). 
    Analyze it deeply and provide a precise score out of 100.
    Break down the score by the following sections: Headline, Summary, Experience, Skills, Education.
    
    For each section, provide:
    - A score (out of 100)
    - The original text (extract exactly what was provided for that section, or say "Not provided" if it's completely missing)
    - An incredibly compelling, improved, rewritten version. Use power verbs, quantify achievements, and optimize for recruiter search (SEO). If missing, write a great hypothetical one.
    - Expert Feedback explaining EXACTLY why your version is better, what the original lacked, and how it impacts profile visibility.
    
    Return the response ONLY in valid JSON format exactly matching this structure (no markdown tags outside the JSON, just the raw JSON object):
    {{
      "total_score": 85,
      "sections": {{
        "Headline": {{ "score": 80, "original": "...", "improved": "...", "feedback": "..." }},
        "Summary": {{ "score": 70, "original": "...", "improved": "...", "feedback": "..." }},
        "Experience": {{ "score": 90, "original": "...", "improved": "...", "feedback": "..." }},
        "Skills": {{ "score": 85, "original": "...", "improved": "...", "feedback": "..." }},
        "Education": {{ "score": 100, "original": "...", "improved": "...", "feedback": "..." }}
      }}
    }}
    
    Profile Data:
    {profile_context}
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Clean the response to ensure it's parseable JSON
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].strip()
        else:
            json_str = response_text.strip()
            
        result_json = json.loads(json_str)
        return jsonify(result_json)
        
    except Exception as e:
        return jsonify({'error': f"AI Analysis failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
