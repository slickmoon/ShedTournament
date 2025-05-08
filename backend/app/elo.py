import math

def probability(rating1, rating2):
    return 1.0 / (1 + math.pow(10, (rating1 - rating2) / 400.0))

def calculate_new_ratings(winner_rating, loser_rating, K=30):
    # Calculate probabilities
    winner_prob = probability(loser_rating, winner_rating)
    loser_prob = probability(winner_rating, loser_rating)
    
    # Calculate new ratings
    new_winner_rating = winner_rating + K * (1 - winner_prob)
    new_loser_rating = loser_rating + K * (0 - loser_prob)
    
    return round(new_winner_rating), round(new_loser_rating) 