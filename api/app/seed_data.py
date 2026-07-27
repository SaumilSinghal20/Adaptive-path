import json

SEED_TOPICS = [
    {"id": "foundations", "label": "Foundations", "parent_id": None,
     "content_text": "Core programming foundations covering variables, control flow, and problem decomposition before tackling data structures."},
    {"id": "arrays", "label": "Arrays", "parent_id": "foundations",
     "content_text": "Arrays store elements contiguously in memory, enabling O(1) index access. Core operations: traversal, insertion, deletion, searching."},
    {"id": "twopointers", "label": "Two pointers", "parent_id": "arrays",
     "content_text": "Two pointer technique uses two indices moving through a sequence to solve problems like pair sums, reversing, and partitioning in O(n)."},
    {"id": "slidingwindow", "label": "Sliding window", "parent_id": "twopointers",
     "content_text": "Sliding window maintains a contiguous range that expands or contracts based on a constraint, solving subarray and substring problems in O(n)."},
    {"id": "linkedlists", "label": "Linked lists", "parent_id": "foundations",
     "content_text": "Linked lists store nodes each pointing to the next, trading random access for O(1) insertion and removal. Classic patterns: reversal, cycle detection, merging."},
    {"id": "trees", "label": "Trees", "parent_id": "linkedlists",
     "content_text": "Trees are hierarchical structures with a root and child nodes. Binary search trees, traversals (in-order, pre-order, post-order), and balancing."},
    {"id": "graphs", "label": "Graphs", "parent_id": "trees",
     "content_text": "Graphs model relationships between nodes via edges. Traversal with BFS and DFS, shortest paths, and detecting cycles in directed and undirected graphs."},
    {"id": "dp", "label": "Dynamic programming", "parent_id": "slidingwindow",
     "content_text": "Dynamic programming breaks problems into overlapping subproblems, storing solutions to avoid recomputation, using memoization or tabulation."},
]

# Starting mastery per topic, used only when seeding a brand new learner
SEED_MASTERY = {
    "foundations": 0.96, "arrays": 0.92, "twopointers": 0.81, "slidingwindow": 0.46,
    "linkedlists": 0.12, "trees": 0.04, "graphs": 0.0, "dp": 0.0,
}

# Quiz questions per topic — seeded into the DB on startup.
# options is stored as a JSON string in the DB; answer_index is 0-based.
SEED_QUESTIONS = [
    # Foundations
    {"topic_id": "foundations", "question": "Which of the following best describes 'control flow'?",
     "options": json.dumps(["The order in which program statements are executed", "Memory allocation for variables", "Network communication protocol"]),
     "answer_index": 0},
    {"topic_id": "foundations", "question": "What is the purpose of decomposing a problem?",
     "options": json.dumps(["Breaking it into smaller, manageable sub-problems", "Increasing code complexity", "Avoiding the use of functions"]),
     "answer_index": 0},
    {"topic_id": "foundations", "question": "A variable in programming stores:",
     "options": json.dumps(["A memory address holding a value", "Only integer numbers", "The CPU clock speed"]),
     "answer_index": 0},

    # Arrays
    {"topic_id": "arrays", "question": "What is the time complexity of accessing an element by index in an array?",
     "options": json.dumps(["O(1)", "O(n)", "O(log n)"]),
     "answer_index": 0},
    {"topic_id": "arrays", "question": "Arrays store elements:",
     "options": json.dumps(["Contiguously in memory", "At random memory locations", "In a linked fashion"]),
     "answer_index": 0},
    {"topic_id": "arrays", "question": "Inserting an element in the middle of an array typically costs:",
     "options": json.dumps(["O(n) due to shifting", "O(1)", "O(log n)"]),
     "answer_index": 0},

    # Two Pointers
    {"topic_id": "twopointers", "question": "The two-pointer technique is most effective for:",
     "options": json.dumps(["Sorted arrays or sequences with two-end traversal", "Graph traversal", "Hashing data"]),
     "answer_index": 0},
    {"topic_id": "twopointers", "question": "What is the typical time complexity of two-pointer solutions?",
     "options": json.dumps(["O(n)", "O(n²)", "O(n log n)"]),
     "answer_index": 0},
    {"topic_id": "twopointers", "question": "Two pointers can solve the 'pair sum in sorted array' problem because:",
     "options": json.dumps(["Sorted order lets you adjust pointers based on the current sum", "Random access is fast", "Binary trees are used internally"]),
     "answer_index": 0},

    # Sliding Window
    {"topic_id": "slidingwindow", "question": "A sliding window is most useful for problems involving:",
     "options": json.dumps(["Contiguous subarrays/substrings", "Sorting entire arrays", "Graph traversal"]),
     "answer_index": 0},
    {"topic_id": "slidingwindow", "question": "What typically shrinks the window in a variable-size sliding window?",
     "options": json.dumps(["Violating the window's constraint", "Reaching the end of the array", "Random selection"]),
     "answer_index": 0},
    {"topic_id": "slidingwindow", "question": "Sliding window problems commonly build on which prerequisite?",
     "options": json.dumps(["Two pointers", "Binary search trees", "Topological sort"]),
     "answer_index": 0},

    # Linked Lists
    {"topic_id": "linkedlists", "question": "What is the main advantage of a linked list over an array?",
     "options": json.dumps(["Efficient insertion/removal without shifting", "O(1) random access", "Better cache locality"]),
     "answer_index": 0},
    {"topic_id": "linkedlists", "question": "Detecting a cycle in a linked list is classically solved with:",
     "options": json.dumps(["Floyd's tortoise and hare", "Binary search", "Dijkstra's algorithm"]),
     "answer_index": 0},
    {"topic_id": "linkedlists", "question": "A doubly linked list adds which capability over a singly linked list?",
     "options": json.dumps(["Traversal in both directions", "Faster search", "Guaranteed sorted order"]),
     "answer_index": 0},

    # Trees
    {"topic_id": "trees", "question": "In a Binary Search Tree (BST), values in the left subtree are:",
     "options": json.dumps(["Less than the root", "Greater than the root", "Equal to the root"]),
     "answer_index": 0},
    {"topic_id": "trees", "question": "Which traversal visits: left → root → right?",
     "options": json.dumps(["In-order", "Pre-order", "Post-order"]),
     "answer_index": 0},
    {"topic_id": "trees", "question": "The height of a balanced binary tree with n nodes is approximately:",
     "options": json.dumps(["O(log n)", "O(n)", "O(n²)"]),
     "answer_index": 0},

    # Graphs
    {"topic_id": "graphs", "question": "BFS (Breadth-First Search) is best for:",
     "options": json.dumps(["Finding the shortest path in an unweighted graph", "Topological sorting", "Detecting strongly connected components"]),
     "answer_index": 0},
    {"topic_id": "graphs", "question": "A directed acyclic graph (DAG) is used in:",
     "options": json.dumps(["Task scheduling and dependency resolution", "Only undirected problems", "Binary search"]),
     "answer_index": 0},
    {"topic_id": "graphs", "question": "Cycle detection in an undirected graph can be done with:",
     "options": json.dumps(["DFS + visited tracking", "Binary search", "Sliding window"]),
     "answer_index": 0},

    # Dynamic Programming
    {"topic_id": "dp", "question": "Dynamic programming solves problems by:",
     "options": json.dumps(["Storing solutions to overlapping subproblems", "Brute-force backtracking", "Random sampling"]),
     "answer_index": 0},
    {"topic_id": "dp", "question": "Memoization is a top-down DP technique that:",
     "options": json.dumps(["Caches results of subproblems to avoid recomputation", "Solves all subproblems upfront", "Uses greedy choices"]),
     "answer_index": 0},
    {"topic_id": "dp", "question": "The classic 0/1 Knapsack problem is solved efficiently with:",
     "options": json.dumps(["Dynamic programming in O(n × W) time", "Two-pointer in O(n)", "Binary search in O(log n)"]),
     "answer_index": 0},
]
