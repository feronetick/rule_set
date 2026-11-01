import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'scripts'))

class Categories(unittest.TestCase):
    def test_exact_typed_geosite_conversion(self):
        import xray_categories as x
        enc = lambda n, b: bytes([n*8+2, len(b)])+b
        domains = b''.join(enc(2, bytes([8,t])+enc(2,v.encode())) for t,v in enumerate(['ads','^ads\\.','ads.example','exact.example']))
        dat = enc(1, enc(1,b'CATEGORY-ADS-ALL')+domains)
        self.assertEqual(x.convert(dat,'category-ads-all','geosite'), {'version':3,'rules':[{
            'domain_keyword':['ads'],'domain_regex':['^ads\\.'],'domain_suffix':['ads.example'],'domain':['exact.example']}]})
    def test_private_is_exact_dat_networks_not_native_heuristic(self):
        import xray_categories as x
        enc = lambda n,b: bytes([n*8+2,len(b)])+b
        dat=enc(1,enc(1,b'PRIVATE')+enc(2,enc(1,bytes([100,64,0,0]))+bytes([16,10])))
        self.assertEqual(x.convert(dat,'private','geoip')['rules'],[{'ip_cidr':['100.64.0.0/10']}])
        with self.assertRaises(ValueError): x.convert(dat,'absent','geoip')
        with self.assertRaises(ValueError): x.convert(enc(1,enc(1,b'PRIVATE')+bytes([24,1])),'private','geoip')
