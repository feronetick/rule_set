import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class SplitTests(unittest.TestCase):
    def test_split_preserves_domain_types_and_exact_ip_union(self):
        path = ROOT / 'scripts' / 'split_rules.py'
        self.assertTrue(path.exists(), 'split builder is missing')
        spec = importlib.util.spec_from_file_location('split_rules', path)
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        domains, ips = module.split_rules({'version': 1, 'rules': [
            {'domain': ['exact.example'], 'domain_suffix': ['suffix.example'],
             'domain_keyword': ['needle'], 'domain_regex': [r'^re\d+\.example$']},
            {'ip_cidr': ['192.0.2.1/25', '192.0.2.128/25', '192.0.2.0/24',
                         '2001:db8::1/127', '2001:db8::2/127', '198.51.100.1']},
            {'domain': ['exact.example']}]})
        self.assertEqual(domains, {'version': 1, 'rules': [{
            'domain': ['exact.example'], 'domain_suffix': ['suffix.example'],
            'domain_keyword': ['needle'], 'domain_regex': [r'^re\d+\.example$']}]})
        self.assertEqual(ips, {'version': 1, 'rules': [{'ip_cidr': [
            '192.0.2.0/24', '198.51.100.1/32', '2001:db8::/126']}]})

    def test_rejects_semantics_that_cannot_be_split_safely(self):
        spec = importlib.util.spec_from_file_location('split_rules', ROOT / 'scripts/split_rules.py')
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        for rule in [
            {'domain': ['a.example'], 'ip_cidr': ['192.0.2.0/24']},
            {'domain': ['a.example'], 'invert': True},
            {'type': 'logical', 'mode': 'and', 'rules': []},
            {'port': [443]}, {'ip_cidr': ['999.1.2.3/24']},
            {'domain': 'a.example'}, {'domain': [123]},
        ]:
            with self.subTest(rule=rule), self.assertRaises((ValueError, TypeError)):
                module.split_rules({'version': 1, 'rules': [rule]})


if __name__ == '__main__':
    unittest.main()
