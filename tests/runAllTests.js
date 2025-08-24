// Comprehensive test runner for Harvest Moon game testing
// Executes unit tests, integration tests, and performance benchmarks

import FarmingSystemTest from './FarmingSystemTest.js';
import SaveLoadTest from './SaveLoadTest.js';
import CollisionSystemTest from './CollisionSystemTest.js';
import IntegrationTest from './IntegrationTest.js';
import PerformanceTest from './PerformanceTest.js';

class TestRunner {
  constructor() {
    this.testSuites = [
      { name: 'FarmingSystem', test: FarmingSystemTest },
      { name: 'SaveLoad', test: SaveLoadTest },
      { name: 'CollisionSystem', test: CollisionSystemTest },
      { name: 'Integration', test: IntegrationTest },
      { name: 'Performance', test: PerformanceTest }
    ];
    this.totalResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      suiteResults: []
    };
  }

  async runAllTests() {
    console.log('🧪 Running Harvest Moon Unit Tests\n');
    console.log('=' .repeat(50));
    
    const startTime = performance.now();

    for (const suite of this.testSuites) {
      console.log(`\n📦 Running ${suite.name} tests...`);
      
      try {
        const results = await suite.test.runTests();
        
        this.totalResults.passed += results.passed;
        this.totalResults.failed += results.failed;
        this.totalResults.skipped += results.skipped;
        this.totalResults.errors.push(...results.errors);
        this.totalResults.suiteResults.push({
          name: suite.name,
          ...results
        });
        
      } catch (error) {
        console.error(`❌ Failed to run ${suite.name} tests:`, error.message);
        this.totalResults.failed++;
        this.totalResults.errors.push({
          test: `${suite.name} - Suite Error`,
          error: error.message
        });
      }
    }

    const totalTime = performance.now() - startTime;
    this.printOverallResults(totalTime);
    
    return this.totalResults;
  }

  printOverallResults(totalTime) {
    const total = this.totalResults.passed + this.totalResults.failed + this.totalResults.skipped;
    const successRate = total > 0 ? (this.totalResults.passed / total * 100).toFixed(1) : 0;
    
    console.log('\n' + '=' .repeat(50));
    console.log('🏁 Overall Test Results Summary:');
    console.log('=' .repeat(50));
    
    // Suite breakdown
    console.log('\n📊 Suite Results:');
    this.totalResults.suiteResults.forEach(suite => {
      const suiteTotal = suite.passed + suite.failed + suite.skipped;
      const suiteRate = suiteTotal > 0 ? (suite.passed / suiteTotal * 100).toFixed(1) : 0;
      const status = suite.failed === 0 ? '✅' : '❌';
      console.log(`   ${status} ${suite.name}: ${suite.passed}/${suiteTotal} passed (${suiteRate}%)`);
    });
    
    // Overall stats
    console.log('\n📈 Overall Statistics:');
    console.log(`   Total Tests: ${total}`);
    console.log(`   ✅ Passed: ${this.totalResults.passed}`);
    console.log(`   ❌ Failed: ${this.totalResults.failed}`);
    console.log(`   ⏭️  Skipped: ${this.totalResults.skipped}`);
    console.log(`   ⏱️  Duration: ${totalTime.toFixed(2)}ms`);
    console.log(`   🎯 Success Rate: ${successRate}%`);

    // Failed tests detail
    if (this.totalResults.failed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.totalResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.test}:`);
        console.log(`      ${error.error}`);
      });
    }

    // Final status
    if (this.totalResults.failed === 0) {
      console.log('\n🎉 All tests passed! The core systems are working correctly.');
    } else {
      console.log(`\n⚠️  ${this.totalResults.failed} test(s) failed. Please review the failures above.`);
    }
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  const runner = new TestRunner();
  runner.runAllTests().then(results => {
    if (typeof process !== 'undefined') {
      // Exit with error code if tests failed (for CI/CD)
      process.exit(results.failed > 0 ? 1 : 0);
    }
  }).catch(error => {
    console.error('Critical error running tests:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  });
}

export { TestRunner };