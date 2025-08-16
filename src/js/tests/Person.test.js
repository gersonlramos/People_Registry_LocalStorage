import { Person, ValidationResult } from "../models/Person.js";

/**
 * Unit tests for Person model validation
 */
export class PersonTests {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run all tests
   */
  runAllTests() {
    console.log("Running Person model tests...");

    this.testNameValidation();
    this.testBirthDateValidation();
    this.testPhoneValidation();
    this.testEmailValidation();
    this.testPersonCreation();
    this.testPersonValidation();
    this.testPersonSerialization();

    this.printResults();
    return this.testResults;
  }

  /**
   * Test name validation
   */
  testNameValidation() {
    const tests = [
      // Valid names
      { input: "João Silva", expected: true, description: "Valid simple name" },
      {
        input: "Maria José da Silva",
        expected: true,
        description: "Valid compound name",
      },
      {
        input: "José-Carlos",
        expected: true,
        description: "Valid hyphenated name",
      },
      {
        input: "O'Connor",
        expected: true,
        description: "Valid name with apostrophe",
      },
      {
        input: "Ana Lúcia",
        expected: true,
        description: "Valid name with accent",
      },

      // Invalid names
      { input: "", expected: false, description: "Empty name" },
      { input: "A", expected: false, description: "Too short name" },
      { input: "A".repeat(51), expected: false, description: "Too long name" },
      { input: "João123", expected: false, description: "Name with numbers" },
      {
        input: "João@Silva",
        expected: false,
        description: "Name with special characters",
      },
      { input: null, expected: false, description: "Null name" },
      { input: undefined, expected: false, description: "Undefined name" },
      { input: 123, expected: false, description: "Non-string name" },
    ];

    tests.forEach((test) => {
      const result = Person.validateName(test.input);
      this.addTestResult(
        "Name Validation",
        test.description,
        result === test.expected,
        `Input: "${test.input}", Expected: ${test.expected}, Got: ${result}`
      );
    });
  }

  /**
   * Test birth date validation (Brazilian DD/MM/YYYY format)
   */
  testBirthDateValidation() {
    const today = new Date();
    const validDate = `15/06/${today.getFullYear() - 25}`; // Brazilian format
    const futureDate = `01/01/${today.getFullYear() + 1}`;
    const oldDate = `01/01/${today.getFullYear() - 121}`;
    const todayBR = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const validOldDate = `01/01/${today.getFullYear() - 120}`;

    const tests = [
      // Valid dates
      {
        input: validDate,
        expected: true,
        description: "Valid birth date (25 years old)",
      },
      {
        input: todayBR,
        expected: true,
        description: "Birth date today",
      },
      {
        input: validOldDate,
        expected: true,
        description: "Birth date 120 years ago",
      },
      {
        input: "25/12/1990",
        expected: true,
        description: "Valid Christmas date 1990",
      },
      {
        input: "01/01/2000",
        expected: true,
        description: "Valid Y2K date",
      },

      // Invalid dates
      { input: futureDate, expected: false, description: "Future birth date" },
      {
        input: oldDate,
        expected: false,
        description: "Too old birth date (121 years)",
      },
      {
        input: "32/01/1990",
        expected: false,
        description: "Invalid day (32)",
      },
      {
        input: "15/13/1990",
        expected: false,
        description: "Invalid month (13)",
      },
      {
        input: "29/02/1990",
        expected: false,
        description: "Invalid leap year date",
      },
      {
        input: "31/02/1990",
        expected: false,
        description: "Invalid February date",
      },
      {
        input: "1990-01-01",
        expected: false,
        description: "ISO format (should be DD/MM/YYYY)",
      },
      {
        input: "01/01/90",
        expected: false,
        description: "Two-digit year",
      },
      {
        input: "invalid-date",
        expected: false,
        description: "Invalid date format",
      },
      { input: "", expected: false, description: "Empty date" },
      { input: null, expected: false, description: "Null date" },
      { input: undefined, expected: false, description: "Undefined date" },
    ];

    tests.forEach((test) => {
      const result = Person.validateBirthDate(test.input);
      this.addTestResult(
        "Birth Date Validation",
        test.description,
        result === test.expected,
        `Input: "${test.input}", Expected: ${test.expected}, Got: ${result}`
      );
    });
  }

  /**
   * Test phone validation
   */
  testPhoneValidation() {
    const tests = [
      // Valid phones
      {
        input: "(11) 99999-9999",
        expected: true,
        description: "Valid mobile phone with formatting",
      },
      {
        input: "11999999999",
        expected: true,
        description: "Valid mobile phone without formatting",
      },
      {
        input: "(11) 9999-9999",
        expected: true,
        description: "Valid landline phone with formatting",
      },
      {
        input: "1199999999",
        expected: true,
        description: "Valid landline phone without formatting",
      },
      {
        input: "(85) 98765-4321",
        expected: true,
        description: "Valid phone from different area code",
      },

      // Invalid phones
      { input: "123456789", expected: false, description: "Too short phone" },
      { input: "123456789012", expected: false, description: "Too long phone" },
      {
        input: "(01) 99999-9999",
        expected: false,
        description: "Invalid area code (01)",
      },
      {
        input: "(99) 99999-9999",
        expected: false,
        description: "Invalid area code (99)",
      },
      {
        input: "abc-def-ghij",
        expected: false,
        description: "Non-numeric phone",
      },
      { input: "", expected: false, description: "Empty phone" },
      { input: null, expected: false, description: "Null phone" },
      { input: undefined, expected: false, description: "Undefined phone" },
      { input: 123, expected: false, description: "Non-string phone" },
    ];

    tests.forEach((test) => {
      const result = Person.validatePhone(test.input);
      this.addTestResult(
        "Phone Validation",
        test.description,
        result === test.expected,
        `Input: "${test.input}", Expected: ${test.expected}, Got: ${result}`
      );
    });
  }

  /**
   * Test email validation
   */
  testEmailValidation() {
    const tests = [
      // Valid emails
      {
        input: "user@example.com",
        expected: true,
        description: "Valid simple email",
      },
      {
        input: "user.name@example.com",
        expected: true,
        description: "Valid email with dot in name",
      },
      {
        input: "user+tag@example.com",
        expected: true,
        description: "Valid email with plus sign",
      },
      {
        input: "user@subdomain.example.com",
        expected: true,
        description: "Valid email with subdomain",
      },
      {
        input: "user123@example123.com",
        expected: true,
        description: "Valid email with numbers",
      },

      // Invalid emails
      {
        input: "invalid-email",
        expected: false,
        description: "Email without @ symbol",
      },
      {
        input: "@example.com",
        expected: false,
        description: "Email without local part",
      },
      { input: "user@", expected: false, description: "Email without domain" },
      {
        input: "user@.com",
        expected: false,
        description: "Email with invalid domain",
      },
      {
        input: "user@example",
        expected: false,
        description: "Email without TLD",
      },
      {
        input: "user name@example.com",
        expected: false,
        description: "Email with space in local part",
      },
      { input: "", expected: false, description: "Empty email" },
      { input: null, expected: false, description: "Null email" },
      { input: undefined, expected: false, description: "Undefined email" },
      { input: 123, expected: false, description: "Non-string email" },
    ];

    tests.forEach((test) => {
      const result = Person.validateEmail(test.input);
      this.addTestResult(
        "Email Validation",
        test.description,
        result === test.expected,
        `Input: "${test.input}", Expected: ${test.expected}, Got: ${result}`
      );
    });
  }

  /**
   * Test person creation
   */
  testPersonCreation() {
    try {
      const person = new Person(
        "João Silva",
        "01/01/1990",
        "(11) 99999-9999",
        "joao@example.com"
      );

      this.addTestResult(
        "Person Creation",
        "Create valid person",
        person.nome === "JOÃO SILVA" && person.dataNascimento === "01/01/1990",
        `Person created successfully with uppercase name: ${person.nome}`
      );

      this.addTestResult(
        "Person Creation",
        "Person has ID",
        person.id && person.id.startsWith("person_"),
        `Person has valid ID: ${person.id}`
      );

      this.addTestResult(
        "Person Creation",
        "Person has timestamps",
        person.createdAt instanceof Date && person.updatedAt instanceof Date,
        `Person has valid timestamps`
      );
    } catch (error) {
      this.addTestResult(
        "Person Creation",
        "Create valid person",
        false,
        `Error creating person: ${error.message}`
      );
    }
  }

  /**
   * Test person validation
   */
  testPersonValidation() {
    // Valid person
    const validPerson = new Person(
      "João Silva",
      "01/01/1990",
      "(11) 99999-9999",
      "joao@example.com"
    );
    const validResult = validPerson.validate();

    this.addTestResult(
      "Person Validation",
      "Valid person passes validation",
      validResult.isValid && validResult.errors.length === 0,
      `Valid person validation result: ${validResult.isValid}`
    );

    // Invalid person
    const invalidPerson = new Person(
      "",
      "01/01/2030",
      "invalid-phone",
      "invalid-email"
    );
    const invalidResult = invalidPerson.validate();

    this.addTestResult(
      "Person Validation",
      "Invalid person fails validation",
      !invalidResult.isValid && invalidResult.errors.length > 0,
      `Invalid person has ${invalidResult.errors.length} errors`
    );

    this.addTestResult(
      "Person Validation",
      "ValidationResult has error methods",
      typeof invalidResult.getErrorsForField === "function" &&
        typeof invalidResult.getAllMessages === "function",
      `ValidationResult has required methods`
    );
  }

  /**
   * Test person serialization
   */
  testPersonSerialization() {
    const person = new Person(
      "João Silva",
      "01/01/1990",
      "(11) 99999-9999",
      "joao@example.com"
    );

    // Test toJSON
    const json = person.toJSON();
    this.addTestResult(
      "Person Serialization",
      "toJSON works correctly",
      json.nome === "JOÃO SILVA" && json.id === person.id,
      `JSON serialization successful`
    );

    // Test fromJSON
    const restored = Person.fromJSON(json);
    this.addTestResult(
      "Person Serialization",
      "fromJSON works correctly",
      restored.nome === person.nome && restored.id === person.id,
      `JSON deserialization successful`
    );

    this.addTestResult(
      "Person Serialization",
      "Restored person is valid",
      restored.validate().isValid,
      `Restored person passes validation`
    );
  }

  /**
   * Add test result
   */
  addTestResult(category, test, passed, details) {
    this.testResults.push({
      category,
      test,
      passed,
      details,
      timestamp: new Date(),
    });
  }

  /**
   * Print test results
   */
  printResults() {
    const total = this.testResults.length;
    const passed = this.testResults.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`\n=== Person Model Test Results ===`);
    console.log(`Total: ${total}, Passed: ${passed}, Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    // Group by category
    const categories = {};
    this.testResults.forEach((result) => {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    });

    // Print results by category
    Object.entries(categories).forEach(([category, results]) => {
      console.log(`${category}:`);
      results.forEach((result) => {
        const status = result.passed ? "✅" : "❌";
        console.log(`  ${status} ${result.test}`);
        if (!result.passed) {
          console.log(`     ${result.details}`);
        }
      });
      console.log("");
    });
  }

  /**
   * Get test summary
   */
  getSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter((r) => r.passed).length;

    return {
      total,
      passed,
      failed: total - passed,
      successRate: (passed / total) * 100,
      results: this.testResults,
    };
  }
}

// Export for use in other modules
export function runPersonTests() {
  const tests = new PersonTests();
  return tests.runAllTests();
}
