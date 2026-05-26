# ProfileScore - LinkedIn Profile Analyzer

A modern single-page web application that analyzes LinkedIn profiles using AI and provides a score out of 100, broken down by section. It rewrites weak sections and provides actionable feedback.

## Features

*   **Two Input Options:** Paste profile text directly or enter a LinkedIn URL to scrape (Note: URL scraping is often blocked by LinkedIn).
*   **AI Analysis:** Powered by Gemini (Google Generative AI).
*   **Detailed Breakdown:** Scores and feedback for Headline, Summary, Experience, Skills, and Education.
*   **Before & After:** View original text alongside improved, AI-generated text.
*   **Modern Design:** Dark theme, glassmorphism cards, animated gradient background, smooth transitions, and animated score counters.

## Tech Stack

*   **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
*   **Backend:** Python, Flask
*   **Scraping:** BeautifulSoup4, Requests
*   **AI:** Gemini API

## Setup Instructions

1.  **Install Dependencies:**
    Make sure you have Python installed, then run:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Set Environment Variables:**
    Create a `.env` file in the root directory (where `app.py` is located) and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

3.  **Run the Application:**
    Start the Flask server:
    ```bash
    python app.py
    ```

4.  **Access the App:**
    Open your web browser and navigate to `http://127.0.0.1:5000/`.
