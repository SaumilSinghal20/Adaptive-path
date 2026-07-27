"""
Bayesian Knowledge Tracing (BKT).

Standard 4-parameter BKT model. This is the real algorithm (not a placeholder) —
it replaces the frontend's rough "+/- points per quiz" mock formula with the
actual probabilistic update used in adaptive learning systems.

Parameters (reasonable defaults, tune later with real data):
  p_init   - prior probability the learner already knows the skill
  p_transit- probability of learning the skill after an opportunity (even if
             they got it wrong)
  p_slip   - probability of an incorrect answer despite knowing the skill
  p_guess  - probability of a correct answer despite not knowing the skill
"""

DEFAULT_PARAMS = {
    "p_init": 0.1,
    "p_transit": 0.25,
    "p_slip": 0.1,
    "p_guess": 0.2,
}


def bkt_update(p_mastery: float, correct: bool, params: dict = None) -> float:
    """Single-observation BKT update. Returns new P(mastery)."""
    p = params or DEFAULT_PARAMS
    p_slip, p_guess, p_transit = p["p_slip"], p["p_guess"], p["p_transit"]

    if correct:
        numerator = p_mastery * (1 - p_slip)
        denominator = numerator + (1 - p_mastery) * p_guess
    else:
        numerator = p_mastery * p_slip
        denominator = numerator + (1 - p_mastery) * (1 - p_guess)

    p_correct_given_evidence = numerator / denominator if denominator > 0 else p_mastery
    # apply learning transition: even after a wrong answer, there's a chance they learned it
    p_new = p_correct_given_evidence + (1 - p_correct_given_evidence) * p_transit
    return min(max(p_new, 0.0), 1.0)


def apply_quiz_to_mastery(p_mastery: float, correct_count: int, total_count: int) -> float:
    """Applies BKT sequentially for each question in a quiz attempt."""
    p = p_mastery
    for i in range(total_count):
        is_correct = i < correct_count  # order doesn't matter for this aggregate case
        p = bkt_update(p, is_correct)
    return p
