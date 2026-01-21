#!/bin/bash
# Demo helper functions for treasury agent system

send_uk() { curl -s -X POST http://localhost:4000/a2a/jsonrpc -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"message/send\",\"params\":{\"message\":{\"messageId\":\"$(uuidgen)\",\"role\":\"user\",\"parts\":[{\"kind\":\"text\",\"text\":\"$1\"}],\"kind\":\"message\",\"metadata\":{\"sender\":\"${2:-arp-system}\"}}},\"id\":1}"; }

send_us() { curl -s -X POST http://localhost:5001/a2a/jsonrpc -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"method\":\"message/send\",\"params\":{\"message\":{\"messageId\":\"$(uuidgen)\",\"role\":\"user\",\"parts\":[{\"kind\":\"text\",\"text\":\"$1\"}],\"kind\":\"message\",\"metadata\":{\"sender\":\"${2:-arp-system}\"}}},\"id\":1}"; }

# Usage:
#   send_uk "AP INVOICE: 50 HBAR due for software license"
#   send_us "AR PAYMENT RECEIVED: 2000 HBAR from BigClient Ltd"
#   send_uk "BALANCE ALERT: Review cash position" "treasury-system"
