#!/bin/bash
# Static Site Testing Script
# Tests the published static site for accessibility and correctness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get static site URL from WordPress
echo "Getting static site URL..."
STATIC_SITE_URL=$(cd /Users/aristath/Local\ Sites/local/app/public/wp-content/plugins/aether && wp eval "
\$deployment_url = \\Aether\\Utilities\\OptionsHelper::get_deployment_url();
echo \$deployment_url;
" 2>/dev/null | grep -o 'https://[^[:space:]]*')

echo -e "${GREEN}Testing static site: ${STATIC_SITE_URL}${NC}\n"

# Test counter
PASSED=0
FAILED=0

# Function to test a URL
test_url() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    echo -n "Testing ${description}... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "${url}")

    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP ${response})"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP ${response}, expected ${expected_status})"
        ((FAILED++))
        return 1
    fi
}

# Function to test URL content
test_content() {
    local url=$1
    local search_term=$2
    local description=$3

    echo -n "Testing ${description}... "

    content=$(curl -s "${url}")

    if echo "${content}" | grep -q "${search_term}"; then
        echo -e "${GREEN}✓ PASS${NC} (found '${search_term}')"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (did not find '${search_term}')"
        ((FAILED++))
        return 1
    fi
}

echo "=== Basic Accessibility Tests ==="
test_url "${STATIC_SITE_URL}" 200 "Homepage"
test_url "${STATIC_SITE_URL}index.html" 200 "Homepage (index.html)"

echo -e "\n=== Content Tests ==="
test_content "${STATIC_SITE_URL}" "<!DOCTYPE html>" "HTML structure"
test_content "${STATIC_SITE_URL}" "<title>" "Page title"

echo -e "\n=== Archive Tests ==="
test_url "${STATIC_SITE_URL}category/uncategorized/" 200 "Category archive" || true
test_url "${STATIC_SITE_URL}author/admin/" 200 "Author archive" || true

echo -e "\n=== Asset Tests ==="
# Test if CSS is accessible (look for wp-includes/css files in homepage)
css_files=$(curl -s "${STATIC_SITE_URL}" | grep -o 'href="[^"]*\.css' | head -n 1 | cut -d'"' -f2)
if [ -n "$css_files" ]; then
    # Convert relative URL to absolute if needed
    if [[ $css_files != http* ]]; then
        css_files="${STATIC_SITE_URL}${css_files#/}"
    fi
    test_url "${css_files}" 200 "Stylesheet" || true
fi

echo -e "\n=== Summary ==="
echo -e "Tests passed: ${GREEN}${PASSED}${NC}"
echo -e "Tests failed: ${RED}${FAILED}${NC}"
echo -e "Total tests: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed.${NC}"
    exit 1
fi
