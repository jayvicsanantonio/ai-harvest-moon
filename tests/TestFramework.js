// Simple test framework for Harvest Moon game testing
// Provides assertion methods, test runners, and result reporting

export class TestFramework {
    constructor() {
        this.tests = [];
        this.currentSuite = null;
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
        this.verbose = true;
    }
    
    // Create a test suite
    describe(suiteName, callback) {
        console.log(`\n📋 Test Suite: ${suiteName}`);
        this.currentSuite = suiteName;
        callback();
        this.currentSuite = null;
    }
    
    // Create an individual test
    it(testName, callback) {
        const test = {
            suite: this.currentSuite,
            name: testName,
            callback: callback,
            passed: false,
            error: null,
            duration: 0
        };
        
        this.tests.push(test);
    }
    
    // Run all tests
    async runTests() {
        console.log(`\n🧪 Running ${this.tests.length} tests...\n`);
        const startTime = performance.now();
        
        for (const test of this.tests) {
            await this.runSingleTest(test);
        }
        
        const totalTime = performance.now() - startTime;
        this.printResults(totalTime);
        
        return this.results;
    }
    
    // Run a single test
    async runSingleTest(test) {
        const startTime = performance.now();
        
        try {
            await test.callback();
            test.passed = true;
            this.results.passed++;
            
            if (this.verbose) {
                console.log(`✅ ${test.suite ? test.suite + ' - ' : ''}${test.name}`);
            }
        } catch (error) {
            test.passed = false;
            test.error = error;
            this.results.failed++;
            this.results.errors.push({
                test: `${test.suite ? test.suite + ' - ' : ''}${test.name}`,
                error: error.message
            });
            
            console.log(`❌ ${test.suite ? test.suite + ' - ' : ''}${test.name}`);
            console.log(`   Error: ${error.message}`);
        }
        
        test.duration = performance.now() - startTime;
    }
    
    // Print test results summary
    printResults(totalTime) {
        const total = this.results.passed + this.results.failed + this.results.skipped;
        
        console.log(`\n📊 Test Results Summary:`);
        console.log(`   Total: ${total}`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   ⏭️  Skipped: ${this.results.skipped}`);
        console.log(`   ⏱️  Duration: ${totalTime.toFixed(2)}ms`);
        
        if (this.results.failed > 0) {
            console.log(`\n🔍 Failed Tests:`);
            this.results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
            });
        }
        
        const successRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
        console.log(`\n🎯 Success Rate: ${successRate}%`);
    }
    
    // Assertion methods
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            const error = message || `Expected ${expected}, but got ${actual}`;
            throw new Error(error);
        }
    }
    
    assertNotEqual(actual, unexpected, message) {
        if (actual === unexpected) {
            const error = message || `Expected value not to be ${unexpected}`;
            throw new Error(error);
        }
    }
    
    assertTruthy(value, message) {
        if (!value) {
            const error = message || `Expected truthy value, got ${value}`;
            throw new Error(error);
        }
    }
    
    assertFalsy(value, message) {
        if (value) {
            const error = message || `Expected falsy value, got ${value}`;
            throw new Error(error);
        }
    }
    
    assertThrows(callback, expectedError, message) {
        let threwError = false;
        let actualError = null;
        
        try {
            callback();
        } catch (error) {
            threwError = true;
            actualError = error;
        }
        
        if (!threwError) {
            const error = message || 'Expected function to throw an error';
            throw new Error(error);
        }
        
        if (expectedError && !(actualError instanceof expectedError)) {
            const error = message || `Expected ${expectedError.name}, got ${actualError.constructor.name}`;
            throw new Error(error);
        }
    }
    
    assertAlmostEqual(actual, expected, tolerance = 0.001, message) {
        const diff = Math.abs(actual - expected);
        if (diff > tolerance) {
            const error = message || `Expected ${expected} ± ${tolerance}, but got ${actual} (diff: ${diff})`;
            throw new Error(error);
        }
    }
    
    assertArrayEqual(actual, expected, message) {
        if (!Array.isArray(actual) || !Array.isArray(expected)) {
            const error = message || 'Both values must be arrays';
            throw new Error(error);
        }
        
        if (actual.length !== expected.length) {
            const error = message || `Array lengths differ: expected ${expected.length}, got ${actual.length}`;
            throw new Error(error);
        }
        
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                const error = message || `Arrays differ at index ${i}: expected ${expected[i]}, got ${actual[i]}`;
                throw new Error(error);
            }
        }
    }
    
    assertObjectEqual(actual, expected, message) {
        const actualJson = JSON.stringify(actual);
        const expectedJson = JSON.stringify(expected);
        
        if (actualJson !== expectedJson) {
            const error = message || `Objects differ:\nExpected: ${expectedJson}\nActual: ${actualJson}`;
            throw new Error(error);
        }
    }
    
    // Async assertion helpers
    async assertAsync(asyncCallback, message = 'Async assertion failed') {
        const result = await asyncCallback();
        this.assert(result, message);
    }
    
    async assertRejects(asyncCallback, expectedError, message) {
        let threwError = false;
        let actualError = null;
        
        try {
            await asyncCallback();
        } catch (error) {
            threwError = true;
            actualError = error;
        }
        
        if (!threwError) {
            const error = message || 'Expected async function to reject';
            throw new Error(error);
        }
        
        if (expectedError && !(actualError instanceof expectedError)) {
            const error = message || `Expected ${expectedError.name}, got ${actualError.constructor.name}`;
            throw new Error(error);
        }
    }
}

// Global test instance
export const test = new TestFramework();

// Convenience exports
export const { describe, it, assert, assertEqual, assertNotEqual, assertTruthy, 
    assertFalsy, assertThrows, assertAlmostEqual, assertArrayEqual, 
    assertObjectEqual, assertAsync, assertRejects } = test;