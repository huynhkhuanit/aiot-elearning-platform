// Test utilities - Run with: npm test or in browser console

import { validateHTML, validateCSS, sanitizeHTML } from "../utils"

// Test HTML Validation
console.group("HTML Validation Tests")

console.log("Test 1: Valid HTML")
console.log(validateHTML('<div class="container"><h1>Hello</h1></div>'))
// Expected: { isValid: true, errors: [] }

console.log("\nTest 2: Unclosed tag")
console.log(validateHTML('<h1>Hello'))
// Expected: { isValid: false, errors: ['Unclosed tag: <h1>'] }

console.log("\nTest 3: Mismatched closing tag")
console.log(validateHTML('<div>Hello</span>'))
// Expected: { isValid: false, errors: [...] }

console.log("\nTest 4: Multiple unclosed tags")
console.log(validateHTML('<div><h1><p>Test'))
// Expected: { isValid: false, errors: ['Unclosed tag: <p>', 'Unclosed tag: <h1>', 'Unclosed tag: <div>'] }

console.log("\nTest 5: Self-closing tags (valid)")
console.log(validateHTML('<img src="test.jpg" /><br /><input type="text" />'))
// Expected: { isValid: true, errors: [] }

console.groupEnd()

// Test CSS Validation
console.group("CSS Validation Tests")

console.log("Test 1: Valid CSS")
console.log(validateCSS('.class { color: red; background: blue; }'))
// Expected: { isValid: true, errors: [] }

console.log("\nTest 2: Unclosed braces")
console.log(validateCSS('.class { color: red;'))
// Expected: { isValid: false, errors: ['Mismatched braces: 1 opening, 0 closing'] }

console.log("\nTest 3: Unclosed string")
console.log(validateCSS('.class { content: "test; }'))
// Expected: { isValid: false, errors: ['Unclosed double quote in CSS'] }

console.log("\nTest 4: Unclosed comment")
console.log(validateCSS('/* This is a comment .class { color: red; }'))
// Expected: { isValid: false, errors: ['Unclosed CSS comment'] }

console.groupEnd()

// Test HTML Sanitization
console.group("HTML Sanitization Tests")

console.log("Test 1: Wrap and sanitize")
console.log(sanitizeHTML('<h1>Test</h1>'))
// Should wrap in container and return safe HTML

console.log("\nTest 2: Fix broken HTML structure")
console.log(sanitizeHTML('<div><h1>Test</div>'))
// Should attempt to fix structure

console.groupEnd()

// Integration Test
console.group("Integration Test: Real-world scenario")

const userHTML = `
<h1>My Website
<div class="container">
  <p>This is a paragraph
  <button>Click Me</button>
</div>
`

console.log("User HTML:", userHTML)
const validation = validateHTML(userHTML)
console.log("Validation Result:", validation)

if (!validation.isValid) {
  console.warn("⚠️ Errors detected:")
  validation.errors.forEach((error, index) => {
    console.error(`  ${index + 1}. ${error}`)
  })
}

const sanitized = sanitizeHTML(userHTML)
console.log("Sanitized HTML:", sanitized)

console.groupEnd()

console.log("\n✅ All tests completed!")
console.log("Check console output above for results")
