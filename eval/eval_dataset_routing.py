"""Evaluation dataset for testing the main agent's tool routing.

Each entry has:
  - inputs.query: the user question
  - expectations.expected_tool: which tool the agent SHOULD call
    One of: "query_airties_ka", "genie"
"""

eval_dataset_routing = [
    # ── Should route to query_airties_ka (WiFi product knowledge) ────────────
    {
        "inputs": {"query": "What Wi-Fi standard does the Air 4960 support?"},
        "expectations": {"expected_tool": "query_airties_ka"},
    },
    {
        "inputs": {"query": "How do I set up my AirTies mesh extender?"},
        "expectations": {"expected_tool": "query_airties_ka"},
    },
    {
        "inputs": {"query": "Does the Air 4930 support MU-MIMO?"},
        "expectations": {"expected_tool": "query_airties_ka"},
    },
    {
        "inputs": {"query": "How do I enable Parental Controls on my AirTies network?"},
        "expectations": {"expected_tool": "query_airties_ka"},
    },
    {
        "inputs": {"query": "My WiFi keeps disconnecting, what should I check?"},
        "expectations": {"expected_tool": "query_airties_ka"},
    },

    # ── Should route to Genie (operational data, no dedicated tool) ──────────
    {
        "inputs": {"query": "Show me all WiFi events for device MAC AA:BB:CC:DD:EE:FF in the last hour"},
        "expectations": {"expected_tool": "genie"},
    },
    {
        "inputs": {"query": "What is the average speed test result across all mesh nodes today?"},
        "expectations": {"expected_tool": "genie"},
    },
    {
        "inputs": {"query": "List all client devices currently connected to zone A"},
        "expectations": {"expected_tool": "genie"},
    },
    {
        "inputs": {"query": "How many mesh nodes are offline right now?"},
        "expectations": {"expected_tool": "genie"},
    },
    {
        "inputs": {"query": "Show me the speed test history for the last 24 hours"},
        "expectations": {"expected_tool": "genie"},
    },
]
