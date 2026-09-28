# TXT Question Format Guide

This guide explains how to structure a TXT file to import questions into the Quiz Management System.

## Format Rules

### Basic Structure

A TXT file can contain one or multiple questions. Each question section consists of:
1. **Question text** (required)
2. **Answer options** (minimum 2 required)
3. **Explanation/Comment** (optional)

### Question Sections

Questions are separated by **ONE empty line** (pressing Enter twice).

### Question Text

- Starts at the beginning of a section
- Can span multiple lines (e.g., English + Hindi translations)
- Optional numbering (1), 2), 3), etc.) will be automatically removed
- No special marker needed
- Examples:
  ```
  Among the following animals, which of these animals lives in the water?
  ```
  
  Or with numbering and bilingual:
  ```
  1) SSS stands for __________ (Hint: Services Contracts)
  SSS का अर्थ __________ है (संकेत: सेवा अनुबंध)
  ```

### Answer Options

- Each option starts on a new line
- **Correct answers** are marked with an asterisk: `*`
- **Wrong answers** are marked with a dash: `-`
- Options can span multiple lines (continuation lines don't need markers)
- At least one correct answer is required
- Minimum 2 options required

Example:
```
-Cat
-Dog
*Fish
-Horse
```

### Explanation (Optional)

- Starts with the greater-than symbol: `>`
- Can span multiple lines
- Must come after all options
- Example:
  ```
  > Fish are aquatic animals that populate seas, oceans, rivers, ponds and water points.
  ```

## Complete Examples

### Single Question (Simple Format)

```
Among the following animals, which of these animals lives in the water?
-Cat
-Dog
*Fish
-Horse
> Fish are aquatic animals that populate seas, oceans, rivers, ponds and water points.
```

### Single Question (With Numbering & Bilingual)

```
1) SSS stands for __________ (Hint: Services Contracts)
SSS का अर्थ __________ है (संकेत: सेवा अनुबंध)
- Single Standard Service
* Similar Single Service
- Specific Single Service
- Single Standard Service
```

### Multiple Questions (Mixed Format)

```
1) SSS stands for __________ (Hint: Services Contracts)
SSS का अर्थ __________ है (संकेत: सेवा अनुबंध)
- Single Standard Service
* Similar Single Service
- Specific Single Service

2) Sole Arbitrator____________ appointed for claims between Rs. 50 Lakhs to Rs. One Crore.
रुपये के बीच दावों के लिए एकमात्र मध्यस्थ____________ नियुक्त किया गया। 50 लाख से रु. एक करोड़.
- SAG & above
* JAG & Above
- Sr.Scale & above
- Retd SAG Officer

3) GFR stands for _______________
जीएफआर का अर्थ _______________ है
* General Financial Rules
- Government Financial Rules
- General Financial Regulations
- Government Financial Regulations
```

### Multiple Questions

```
Among the following animals, which of these animals lives in the water?
-Cat
-Dog
*Fish
-Horse
> Fish are aquatic animals that populate seas, oceans, rivers, ponds and water points.

Which of these animals are flying?
*Pigeon
-Dog
*Raven
*Eagle
> The pigeon, the raven and the eagle are all flying birds.
```

### Multi-line Question and Options

```
What is the capital city of France, known for its iconic
Eiffel Tower and rich cultural heritage?
-London
*Paris
-Berlin
-Madrid
> Paris is the capital and most populous city of France.

Which programming languages are commonly used
for web development?
*JavaScript
*Python
-C++
*PHP
> JavaScript, Python, and PHP are widely used for web development, while C++ is primarily used for system programming.
```

## Important Notes

1. **Empty Lines**: Use exactly ONE empty line to separate questions (press Enter twice)
2. **No Blank Lines Within Questions**: Don't add empty lines within a question section
3. **Encoding**: Use UTF-8 encoding for best compatibility, especially for non-English characters (Hindi, etc.)
4. **Markers**: 
   - `*` for correct answers
   - `-` for wrong answers
   - `>` for explanations (optional)
5. **Multiple Correct Answers**: You can have multiple correct answers by using `*` for each one
6. **Question Numbering**: Optional - numbering like "1)", "2)", "10)" will be automatically removed
7. **Bilingual Questions**: Fully supported - add translations on new lines within the question section
8. **Special Characters**: Supported for Hindi, symbols, mathematical notation, etc.

## Common Mistakes to Avoid

❌ **Wrong**: Using two empty lines between questions
```
Question 1?
-Option A
*Option B


Question 2?
```

✅ **Correct**: Using one empty line between questions
```
Question 1?
-Option A
*Option B

Question 2?
```

❌ **Wrong**: Forgetting markers on options
```
Question?
Option A
Option B
```

✅ **Correct**: Using markers on all options
```
Question?
-Option A
*Option B
```

❌ **Wrong**: No correct answer marked
```
Question?
-Option A
-Option B
-Option C
```

✅ **Correct**: At least one correct answer
```
Question?
-Option A
*Option B
-Option C
```

## Testing Your File

Before importing a large file:
1. Create a test file with 2-3 questions
2. Import it using the Bulk Upload feature
3. Check for any validation errors
4. Fix any issues before importing the full file

### Troubleshooting: Questions Not Splitting Correctly

If your 100 questions are being imported as 1 question:

1. **Check Empty Lines**: Make sure there is exactly ONE empty line between questions
   - Press Enter TWICE after each question to create an empty line
   - Don't use spaces or tabs on the empty line

2. **Check Line Endings**: 
   - The parser now handles Windows (\r\n), Mac (\r), and Linux (\n) line endings
   - If issues persist, try converting your file to UTF-8 encoding

3. **Test with Small File**: 
   - Create a file with just 2 questions first
   - If it works, the format is correct
   - Then try your full 100-question file

4. **Check Console**: 
   - Open browser developer tools (F12)
   - Go to Console tab
   - Look for messages like "Found X question blocks"
   - This shows how many questions were detected

## Need Help?

If you encounter any issues with the format:
1. Check that you're using the correct markers (`*`, `-`, `>`)
2. Verify there's exactly one empty line between questions
3. Ensure at least one option is marked as correct with `*`
4. Make sure you have at least 2 options per question
