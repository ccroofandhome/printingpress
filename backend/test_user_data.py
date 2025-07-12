#!/usr/bin/env python3
"""
Test script to demonstrate user-specific data storage
"""

from user_data import user_data_manager

def test_user_data_separation():
    """Test that different users have separate data"""
    print("Testing User-Specific Data Storage...")
    
    # Test user 1
    user1_email = "user1@example.com"
    user1_exchange = {
        "credentials": {"api_key": "user1_key", "api_secret": "user1_secret"},
        "status": "connected",
        "connected_at": "2024-01-15T10:00:00Z"
    }
    
    # Test user 2
    user2_email = "user2@example.com"
    user2_exchange = {
        "credentials": {"api_key": "user2_key", "api_secret": "user2_secret"},
        "status": "connected",
        "connected_at": "2024-01-15T11:00:00Z"
    }
    
    # Add exchanges for both users
    user_data_manager.add_user_exchange(user1_email, "btcc", user1_exchange)
    user_data_manager.add_user_exchange(user2_email, "binance", user2_exchange)
    
    # Check that users have separate data
    user1_exchanges = user_data_manager.get_user_exchanges(user1_email)
    user2_exchanges = user_data_manager.get_user_exchanges(user2_email)
    
    print(f"User 1 exchanges: {list(user1_exchanges.keys())}")
    print(f"User 2 exchanges: {list(user2_exchanges.keys())}")
    
    # Verify separation
    assert "btcc" in user1_exchanges
    assert "binance" in user2_exchanges
    assert "btcc" not in user2_exchanges
    assert "binance" not in user1_exchanges
    
    print("✅ User data separation working correctly!")
    
    # Test strategy separation
    user1_strategy = {
        "name": "User1 Strategy",
        "description": "Strategy for user 1",
        "config": {"rsi_overbought": 70}
    }
    
    user2_strategy = {
        "name": "User2 Strategy", 
        "description": "Strategy for user 2",
        "config": {"rsi_overbought": 80}
    }
    
    user_data_manager.save_user_strategy(user1_email, "strategy1", user1_strategy)
    user_data_manager.save_user_strategy(user2_email, "strategy2", user2_strategy)
    
    user1_strategies = user_data_manager.get_user_strategies(user1_email)
    user2_strategies = user_data_manager.get_user_strategies(user2_email)
    
    print(f"User 1 strategies: {list(user1_strategies.keys())}")
    print(f"User 2 strategies: {list(user2_strategies.keys())}")
    
    assert "strategy1" in user1_strategies
    assert "strategy2" in user2_strategies
    assert "strategy1" not in user2_strategies
    assert "strategy2" not in user1_strategies
    
    print("✅ Strategy separation working correctly!")
    
    # Show data summary
    user1_summary = user_data_manager.get_user_data_summary(user1_email)
    user2_summary = user_data_manager.get_user_data_summary(user2_email)
    
    print(f"\nUser 1 Summary: {user1_summary}")
    print(f"User 2 Summary: {user2_summary}")
    
    print("\n🎉 All user-specific data tests passed!")

if __name__ == "__main__":
    test_user_data_separation() 