"""
Test script for Z.ai LLM integration
"""
from llm_client import (
    ZaiClient, 
    AIAssistantRequest, 
    detect_complexity,
    TaskComplexity,
    get_model_for_complexity
)

def test_complexity_detection():
    print("\n--- Testing Complexity Detection ---")
    
    # Simple
    simple_prompt = "What should I do next?"
    complexity = detect_complexity(simple_prompt, 3)
    print(f"'{simple_prompt[:30]}...' -> {complexity.value} -> {get_model_for_complexity(complexity)}")
    assert complexity == TaskComplexity.SIMPLE
    
    # Moderate
    moderate_prompt = "Break down my study plan into smaller steps"
    complexity = detect_complexity(moderate_prompt, 8)
    print(f"'{moderate_prompt[:30]}...' -> {complexity.value} -> {get_model_for_complexity(complexity)}")
    assert complexity == TaskComplexity.MODERATE
    
    # Complex
    complex_prompt = "Build a piano learning app with spaced repetition"
    complexity = detect_complexity(complex_prompt, 2)
    print(f"'{complex_prompt[:30]}...' -> {complexity.value} -> {get_model_for_complexity(complexity)}")
    assert complexity == TaskComplexity.COMPLEX
    
    print("✅ Complexity detection working correctly")

def test_api_call():
    print("\n--- Testing Z.ai API Call ---")
    
    client = ZaiClient()
    
    request = AIAssistantRequest(
        prompt="I want to organize my day better. I have an exam tomorrow.",
        current_schedule=[
            {"id": 1, "title": "Study for Algorithms", "priority": 8, "deadline": "2026-01-22T12:00:00"},
            {"id": 2, "title": "Apply to jobs", "priority": 6, "deadline": "2026-01-23T17:00:00"}
        ]
    )
    
    response = client.generate_structured_sync(request)
    
    print(f"Model used: {response.llm_model_used}")
    print(f"Complexity: {response.complexity_detected}")
    print(f"Summary: {response.summary}")
    print(f"Suggestions: {len(response.task_suggestions)}")
    print(f"Insights: {len(response.insights)}")
    
    if response.task_suggestions:
        for s in response.task_suggestions[:3]:
            print(f"  - [{s.action}] {s.title or s.task_id}: {s.reason[:50]}...")
    
    if response.raw_response:
        print(f"⚠️ Raw response (parsing issue): {response.raw_response[:200]}...")
    else:
        print("✅ Structured response parsed successfully")

if __name__ == "__main__":
    test_complexity_detection()
    test_api_call()
