# Floors, re-measured WARM, 2026-08-27

The 2026-08-27 first sweep was run against a COLD dev server and three routes came out wrong.
This run followed it on the same instrument, same viewport (390x844), same base, with every
route already compiled. Where the two disagree, THIS one is the record.

WHAT MOVED between the cold run and this one:
  /de/barbershop           cold: 5 floors failed (imagery 21.59%, anchor 20px, weight 45.24%)
                           warm: 3 failed, byte-identical to /de/coiffeur. It is the same
                           template, so the warm reading is the coherent one.
  /de/notifications        cold: anchor 28px PASS, weight 28.57% PASS, elevation 1 FAIL
                           warm: anchor 12px FAIL, ratio 1x FAIL, elevation 2 PASS
  /de/profile/settings     cold: identical to /de/profile, 4 failed
                           warm: 2 failed. It carries the numbers the cold run attributed to
                           notifications, so those two were transposed in the cold record.

UNSETTLED, and named rather than picked: /de/inspo imagery read 0.71% on both full sweeps and
57.88% on one three-route run in between. Its photo tiles load late, so the number depends on
when the probe samples. Two readings of one instrument disagree, so the honest state is that
Inspo's photo share is not established, not that it is 0.71%.

```
/de FLOORS: imagery=28.56%(FAIL) displayAnchor=18px(FAIL) weightShare=37.14%(FAIL) anchorRatio=1.5x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=6px(PASS) elevation=7(PASS)
/de/coiffeur FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=10%(PASS) anchorRatio=1.02x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=5(PASS)
/de/nails FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=10%(PASS) anchorRatio=1.02x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=5(PASS)
/de/spa FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=10%(PASS) anchorRatio=1.02x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=5(PASS)
/de/barbershop FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=10%(PASS) anchorRatio=1.02x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=5(PASS)
/de/basel FLOORS: imagery=0%(FAIL) displayAnchor=25px(FAIL) weightShare=54.55%(FAIL) anchorRatio=1.79x(FAIL) sizeSpread=3distinct,densestCluster=2within8px,globalSpread=13px(PASS) elevation=2(PASS)
/de/basel/coiffeur FLOORS: imagery=0%(FAIL) displayAnchor=14px(FAIL) weightShare=0%(PASS) anchorRatio=1.17x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=4(PASS)
/de/inspo FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=14.29%(PASS) anchorRatio=1.17x(FAIL) sizeSpread=2distinct,densestCluster=2within8px,globalSpread=2px(PASS) elevation=6(PASS)
/de/salon/cuts-and-culture FLOORS: imagery=34.66%(PASS) displayAnchor=30px(PASS) weightShare=30%(PASS) anchorRatio=2.14x(PASS) sizeSpread=5distinct,densestCluster=4within8px,globalSpread=17px(PASS) elevation=3(PASS)
/de/salon/cuts-and-culture/reviews FLOORS: imagery=0%(FAIL) displayAnchor=30px(PASS) weightShare=43.48%(FAIL) anchorRatio=2.31x(PASS) sizeSpread=7distinct,densestCluster=6within8px,globalSpread=18px(FAIL) elevation=2(PASS)
/de/profile FLOORS: imagery=0%(FAIL) displayAnchor=18px(FAIL) weightShare=40%(FAIL) anchorRatio=1.5x(FAIL) sizeSpread=2distinct,densestCluster=2within8px,globalSpread=6px(PASS) elevation=2(PASS)
/de/profile/settings FLOORS: imagery=0%(FAIL) displayAnchor=28px(PASS) weightShare=28.57%(PASS) anchorRatio=1.87x(PASS) sizeSpread=3distinct,densestCluster=2within8px,globalSpread=15px(PASS) elevation=1(FAIL)
/de/notifications FLOORS: imagery=0%(FAIL) displayAnchor=12px(FAIL) weightShare=0%(PASS) anchorRatio=1x(FAIL) sizeSpread=1distinct,densestCluster=1within8px,globalSpread=0px(PASS) elevation=2(PASS)
/de/help FLOORS: imagery=0%(FAIL) displayAnchor=30px(PASS) weightShare=10%(PASS) anchorRatio=2.5x(PASS) sizeSpread=3distinct,densestCluster=2within8px,globalSpread=18px(PASS) elevation=2(PASS)
/de/warum-solen FLOORS: imagery=0%(FAIL) displayAnchor=27.3px(FAIL) weightShare=25%(PASS) anchorRatio=2.1x(PASS) sizeSpread=7distinct,densestCluster=6within8px,globalSpread=15.3px(FAIL) elevation=2(PASS)
```
