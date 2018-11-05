import unittest
import json
import requests
import test.utils.testutils as testutils

class TestApiGet(unittest.TestCase):

	def setUp(self):
		pass

	def tearDown(self):
		pass

	def _test_generic_api_get(self, endpoint, expected_number, status_code):
		""" Ensures that the response contains the expected number of cards """
		url = testutils.URL + endpoint
		response = requests.get(url, verify=False)
		self.assertEqual(response.status_code, status_code)

		cards = response.json()['result']
		self.assertEqual(len(cards), expected_number)

	def _test_generic_post_not_allowed(self, endpoint):
		""" Ensures that POST is not allowed on specified endpoint """
		data = {'some': 'data'}
		url = testutils.URL + endpoint

		response = requests.post(url, data=json.dumps(data),
								headers=testutils.headers)
		self.assertEqual(response.status_code, 405)

	def test_get_minions_cards(self):
		""" Test API call for GET /minions_cards """
		self._test_generic_api_get('minions_cards', 24, 200)
		
	def test_get_functional_cards(self):
		""" Test API call for GET /functional_cards """
		self._test_generic_api_get('functional_cards', 10, 200)

	def test_get_heroes_cards(self):
		""" Test API call for GET /heroes_cards """
		self._test_generic_api_get('heroes_cards', 6, 200)

	def test_get_minions_post_not_allowed(self):
		""" Test POST not allowed for /minions_cards """
		self._test_generic_post_not_allowed('minions_cards')

	def test_get_functional_post_not_allowed(self):
		""" Test POST not allowed for /functional_cards """
		self._test_generic_post_not_allowed('functional_cards')

	def test_get_heroes_post_not_allowed(self):
		""" Test POST not allowed for /heroes_cards """
		self._test_generic_post_not_allowed('heroes_cards')

class TestApiPost(unittest.TestCase):

	endpoints = {
		'minions': 'minions_cards_selector',
		'functional': 'functional_cards_selector',
		'hero': 'hero_card_selector',
		'play': 'play_card',
		'end': 'end_turn'
	}
	username = "john"
	cards = [1, 15, 22, 4, 7, 2, 3, 10, 23, 30, 9]
	
	def setUp(self):
		pass

	def tearDown(self):
		pass

	def _get_api_post_response(self, endpoint, data):
		""" Makes the appropriate POST call and returns response """
		url = testutils.URL + endpoint
		response = requests.post(url,
								data=json.dumps(data),
								headers=testutils.headers)
		return response

	def _test_generic_api_post_success(self, endpoint, data):
		""" Tests the response for successful calls """
		response = self._get_api_post_response(endpoint, data)
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), testutils.expected_true)

	def _test_generic_api_post_invalid_params(self, endpoint, data):
		""" Tests the response if there are invalid parameters """
		response = self._get_api_post_response(endpoint, data)
		js = response.json()

		expected = {
			'message': 'Invalid params',
			'code': -32601
		}
		actual = {
			'message': js['error']['message'],
			'code': js['error']['code']
		}

		self.assertEqual(response.status_code, 200)
		self.assertEqual(expected, actual)

	def _test_generic_get_method_not_allowed(self, endpoint):
		""" Tests that GET method is not allowed on specified endpoint """
		url = testutils.URL + endpoint
		response = requests.get(url, verify=False)
		# self.assertEqual(response.status_code, 404)
		self.assertEqual(response.text, 'Hello world!')

	@unittest.skip('s')
	def test_post_minions_cards_selector_success(self):
		""" Test successful API call for POST /minions_cards_selector """
		data = {
			"username": self.username,
			"cards": self.cards
		}
		self._test_generic_api_post_success(self.endpoints['minions'], data)

	@unittest.skip('s')
	def test_post_functional_cards_selector_success(self):
		""" Test successful API call for POST /functional_cards_selector """
		data = {
			'username': self.username,
			'cards': self.cards[0:5]
		}
		self._test_generic_api_post_success(self.endpoints['functional'], data)

	@unittest.skip('s')
	def test_post_hero_card_selector_success(self):
		""" Test sucessful API call for POST /hero_card_selector """
		data = {
			'username': self.username,
			'card': self.cards[0]
		}
		self._test_generic_api_post_success(self.endpoints['hero'], data)

	def test_post_minions_cards_selector_invalid_params(self):
		""" Test invalid params error for POST /minions_cards_selector """
		self._test_generic_api_post_invalid_params(self.endpoints['minions'],
													testutils.invalid_params_data)

	def test_post_functional_cards_selector_invalid_params(self):
		""" Test invalid params error for POST /functional_cards_selector """
		self._test_generic_api_post_invalid_params(self.endpoints['functional'],
													testutils.invalid_params_data)

	def test_post_hero_card_selector_invalid_params(self):
		""" Test invalid params error for POST /hero_card_selector """
		self._test_generic_api_post_invalid_params(self.endpoints['hero'],
													testutils.invalid_params_data)

	def test_post_minions_cards_more_than_max_number(self):
		""" Test POST /minions_cards_selector with more than 11 cards """
		cards = self.cards.extend([31])
		data = {
			"username": self.username,
			"cards": cards
		}
		self._test_generic_api_post_invalid_params(self.endpoints['minions'],
													data)

	def test_post_functional_cards_more_than_max_number(self):
		""" Test POST /minions_cards_selector with more than 5 cards """
		data = {
			"username": self.username,
			"cards": self.cards[0:6]
		}
		self._test_generic_api_post_invalid_params(self.endpoints['functional'],
													data)

	def test_post_hero_card_selector_more_than_one(self):
		""" Test POST /hero_card_selector with more than 1 card """
		data = {
			"username": self.username,
			"cards": [4, 5]
		}
		self._test_generic_api_post_invalid_params(self.endpoints['hero'],
													data)

	def test_post_play_card_minion(self):
		""" Test API call for POST /play_card """
		data = {
			'username': self.username,
			'card_type': 'M',
			'card_id': 4,
			'position': 'MID'
		}
		# It is not John's turn
		self._test_generic_api_post_invalid_params(self.endpoints['play'],
													data)

	def test_post_play_card_invalid_params(self):
		""" Test invalid params error for POST /play_card """
		self._test_generic_api_post_invalid_params(self.endpoints['play'],
													testutils.invalid_params_data)

	def test_post_end_turn(self):
		"""Test API call for POST /end_turn """
		data = {
			"username": self.username
		}
		self._test_generic_api_post_invalid_params(self.endpoints['end'], data)

	def test_post_end_turn_invalid_params(self):
		""" Test invalid params error for POST /end_turn """
		self._test_generic_api_post_invalid_params(self.endpoints['end'],
													testutils.invalid_params_data)

	def test_minions_selector_get_not_allowed(self):
		""" Test GET not allowed on /minions_cards_selector """
		self._test_generic_get_method_not_allowed(self.endpoints['minions'])

	def test_functional_selector_get_not_allowed(self):
		""" Test GET not allowed on /functional_cards_selector """
		self._test_generic_get_method_not_allowed(self.endpoints['functional'])

	def test_hero_selector_get_not_allowed(self):
		""" Test GET not allowed on /hero_card_selector """
		self._test_generic_get_method_not_allowed(self.endpoints['hero'])

	def test_play_card_get_not_allowed(self):
		""" Test GET not allowed on /play_card """
		self._test_generic_get_method_not_allowed(self.endpoints['play'])

	def test_end_turn_get_not_allowed(self):
		""" Test GET not allowed on /play_card """
		self._test_generic_get_method_not_allowed(self.endpoints['end'])

def suite():
    test_suite = unittest.TestSuite()
    test_suite.addTest(unittest.makeSuite(TestApiGet, "test"))
    test_suite.addTest(unittest.makeSuite(TestApiPost, "test"))
    return test_suite

if __name__ == '__main__':
	unittest.main()