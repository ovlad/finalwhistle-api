import unittest

def fsuite():
    """Return a test suite that contains all tests."""
    # Use late imports so that if we are just running a single test we
    # don't have to import all the others (and more importantly, everything
    # that they import).
    from test.functional import test_finalwhistleapi_functional
    
    test_suite = unittest.TestSuite()
    test_suite.addTest(test_finalwhistleapi_functional.suite())
    return test_suite

def suite():
    test_suite = unittest.TestSuite()
    test_suite.addTest(fsuite())
    return test_suite

if __name__ == '__main__':
    unittest.main(defaultTest='suite')
