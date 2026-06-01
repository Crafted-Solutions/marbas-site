# Parity Report

Date: 2026-05-22  
Overall: **PASS**

## Background

Since Task 30, both App and CLI invoke the same `marbas-site` `build()` function.
App/CLI parity is guaranteed by construction — the code paths are identical.
This report verifies the complementary property: build determinism (two sequential
builds of the same fixture produce byte-identical output).

## Results

### parity-minimal — OK

| Category | Count |
|----------|-------|
| Identical | 18 |
| Explained divergent | 0 |
| **Unexpected divergent** | **0** |

### parity-with-eject — OK

| Category | Count |
|----------|-------|
| Identical | 18 |
| Explained divergent | 0 |
| **Unexpected divergent** | **0** |

### parity-external-css — OK

| Category | Count |
|----------|-------|
| Identical | 18 |
| Explained divergent | 0 |
| **Unexpected divergent** | **0** |
