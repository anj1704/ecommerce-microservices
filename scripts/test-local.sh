#!/bin/bash

set -e

BASE_URL="http://localhost:8080"

echo "=== Testing E-Commerce Microservices ==="

# 1. Health checks
echo -e "\n1. Health Checks"
curl -s http://localhost:8083/health | jq .
curl -s http://localhost:8082/health | jq .
curl -s http://localhost:8081/health | jq .
curl -s http://localhost:8080/health | jq .

# 2. Register user
echo -e "\n2. Register User"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "three@example.com",
    "password": "password123",
    "name": "Test User"
  }')

echo $REGISTER_RESPONSE | jq .

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.access_token')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.user_id')

echo "Token: $TOKEN"
echo "User ID: $USER_ID"

# 3. Login
echo -e "\n3. Login"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "three@example.com",
    "password": "password123"
  }')

echo $LOGIN_RESPONSE | jq .

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.user_id')

echo "Token: $TOKEN"
echo "User ID: $USER_ID"

# 4. Search items
echo -e "\n4. Search Items"
curl -s "$BASE_URL/search?q=laptop" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Add to cart
echo -e "\n5. Add to Cart"
curl -s -X POST "$BASE_URL/cart/$USER_ID/add" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "laptop1",
    "quantity": 1,
    "price": 999.99
  }' | jq .

# 6. View cart
echo -e "\n6. View Cart"
curl -s "$BASE_URL/cart/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 7. Add another item
echo -e "\n7. Add Another Item"
curl -s -X POST "$BASE_URL/cart/$USER_ID/add" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "phone1",
    "quantity": 2,
    "price": 1099.99
  }' | jq .

# 8. View updated cart
echo -e "\n8. View Updated Cart"
curl -s "$BASE_URL/cart/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 9. Place order
echo -e "\n9. Place Order"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/$USER_ID/place" \
  -H "Authorization: Bearer $TOKEN")

echo $ORDER_RESPONSE | jq .

# 10. View orders
echo -e "\n10. View Order History"
curl -s "$BASE_URL/orders/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 11. Verify cart is empty
echo -e "\n11. Verify Cart is Empty"
curl -s "$BASE_URL/cart/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== All Tests Completed ==="
