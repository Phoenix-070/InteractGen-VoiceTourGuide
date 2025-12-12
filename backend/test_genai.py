# test_genai_fix.py
import os
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise SystemExit("Error: GOOGLE_API_KEY not found in environment. Add it to your .env or export it.")

print(f"Key loaded: {API_KEY[:6]}...")

# Step A: List models using official google-generativeai SDK to see supported methods
try:
    import google.generativeai as genai
except Exception as e:
    raise SystemExit("Please `pip install google-generativeai` and retry. Error: " + str(e))

genai.configure(api_key=API_KEY)

print("\nListing models available to this API key (this may take a second)...")
models = genai.list_models()

# Print short summary and search for a generation-capable model
candidate = None
for m in models:
    # m is usually an object with attributes; convert to dict for robust printing
    md = {k: getattr(m, k) for k in dir(m) if not k.startswith("_") and not callable(getattr(m, k))}
    name = md.get("name") or md.get("model") or str(m)
    # print a compact summary
    print("\n---")
    print("name:", name)
    # print some likely fields if they exist
    for key in ("displayName", "description", "capabilities", "supportedGenerationMethods", "supportedMethods", "authRequirements"):
        if md.get(key) is not None:
            print(f"{key}:", md.get(key))
    # crude heuristic: check if any str fields mention "generate" or "text" or "chat"
    joined = json.dumps(md, default=str).lower()
    if candidate is None and ("generate" in joined or "chat" in joined or "text" in joined):
        candidate = name

if candidate is None:
    print("\nNo obvious generation-capable model found in the list above. Paste the printed model list here and I'll help pick one.")
    raise SystemExit("No generation model candidate found.")

print(f"\nSelected candidate model: {candidate}")

# Step B: Try to use LangChain wrapper with that exact model name (most wrappers expect the full model id)
# If it fails, fallback to calling genai.generate_text directly.

print("\nAttempting to call via langchain wrapper (if installed)...")
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    # Try both variants: exact candidate, and candidate without leading "models/" (some wrappers differ)
    tried = []
    for model_variant in (candidate, candidate.replace("models/", "")):
        try:
            tried.append(model_variant)
            print("Trying model id:", model_variant)
            llm = ChatGoogleGenerativeAI(model=model_variant, temperature=0.0)
            # use predict or invoke depending on wrapper implementation
            try:
                out = llm.predict("Hello from test script. Can you reply with 'ok'?")
                print("LangChain wrapper succeeded with .predict() ->", out)
                raise SystemExit(0)
            except Exception:
                # try invoke or generate
                try:
                    resp = llm.invoke("Hello from test script. Can you reply with 'ok'?")
                    print("LangChain wrapper succeeded with .invoke() ->", getattr(resp, "content", str(resp)))
                    raise SystemExit(0)
                except Exception as e_invoke:
                    print("LangChain call failed for", model_variant, ":", e_invoke)
                    # keep going to try other variant
        except Exception as e:
            print("Error creating/using ChatGoogleGenerativeAI with", model_variant, ":", e)
    print("LangChain wrapper attempts exhausted (tried: {})".format(tried))
except Exception as e:
    print("LangChain wrapper not available or failed to import:", e)

print("\nFalling back to the official google-generativeai SDK generate_text call using the same model.")

# Step C: Try the official SDK generate_text/generate method using the selected model
# Note: the exact function name may be generate_text or generate depending on genai version.
payload = {
    "model": candidate,
    "input": "Hello from fallback test. Reply with a short 'ok' message only."
}

# Try a couple of function names that different SDK versions expose
try:
    # new SDK: genai.generate_text
    resp = genai.generate_text(model=candidate, prompt="Hello from fallback test. Reply with 'ok' only.")
    # Try to extract text robustly:
    text = None
    if hasattr(resp, "output"):
        # often resp.output[0].content or resp.output[0].text
        try:
            text = resp.output[0].content[0].text
        except Exception:
            text = str(resp.output)
    else:
        text = str(resp)
    print("SDK generate_text response:", text)
    raise SystemExit(0)
except Exception as e1:
    print("genai.generate_text failed:", e1)

try:
    # older SDKs: genai.generate
    resp2 = genai.generate(model=candidate, prompt="Hello from fallback test. Reply with 'ok' only.")
    print("genai.generate response:", resp2)
    raise SystemExit(0)
except Exception as e2:
    print("genai.generate failed:", e2)

print("\nAll attempts failed. From the earlier printed model list, choose a model name that supports generation and try again.")
print("If you paste the printed model list here, I will pick the correct model ID and give the exact code you should use.")

