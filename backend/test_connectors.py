#!/usr/bin/env python3
"""
Test script for exchange connectors
"""

from exchange_connectors import ExchangeConnectorFactory, ExchangeCredentials

def test_connector_factory():
    """Test the connector factory"""
    print("Testing Exchange Connector Factory...")
    
    # Test supported exchanges
    supported = ExchangeConnectorFactory.get_supported_exchanges()
    print(f"Supported exchanges: {supported}")
    
    # Test creating connectors (with dummy credentials)
    for exchange in supported:
        try:
            credentials = ExchangeCredentials(
                api_key="test_key",
                api_secret="test_secret",
                passphrase="test_passphrase" if exchange == "kucoin" else None,
                sandbox=True
            )
            
            connector = ExchangeConnectorFactory.create_connector(exchange, credentials)
            print(f"✅ Successfully created {exchange} connector")
            
        except Exception as e:
            print(f"❌ Failed to create {exchange} connector: {e}")
    
    print("\nConnector factory test completed!")

if __name__ == "__main__":
    test_connector_factory() 