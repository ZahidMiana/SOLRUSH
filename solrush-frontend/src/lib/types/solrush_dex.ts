/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solrush_dex.json`.
 */
export type SolrushDex = {
  "address": "5AtAVriL32asiRrkSXCLwkYy6E9DefEt6wdtVQVR9CvX",
  "metadata": {
    "name": "solrushDex",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addLiquidity",
      "docs": [
        "Add liquidity to an existing pool"
      ],
      "discriminator": [
        181,
        157,
        89,
        67,
        143,
        182,
        52,
        72
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "tokenAMint"
              },
              {
                "kind": "account",
                "path": "tokenBMint"
              }
            ]
          }
        },
        {
          "name": "tokenAMint"
        },
        {
          "name": "tokenBMint"
        },
        {
          "name": "lpTokenMint",
          "writable": true
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "tokenAVault",
          "writable": true
        },
        {
          "name": "tokenBVault",
          "writable": true
        },
        {
          "name": "userTokenA",
          "writable": true
        },
        {
          "name": "userTokenB",
          "writable": true
        },
        {
          "name": "userLpTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "lpTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amountA",
          "type": "u64"
        },
        {
          "name": "amountB",
          "type": "u64"
        },
        {
          "name": "minLpTokens",
          "type": "u64"
        }
      ]
    },
    {
      "name": "calculatePendingRewards",
      "docs": [
        "Calculate pending rewards for a position"
      ],
      "discriminator": [
        56,
        207,
        218,
        85,
        139,
        115,
        80,
        43
      ],
      "accounts": [
        {
          "name": "position"
        },
        {
          "name": "pool"
        },
        {
          "name": "rushConfig"
        }
      ],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "cancelLimitOrder",
      "docs": [
        "Cancel a limit order"
      ],
      "discriminator": [
        132,
        156,
        132,
        31,
        67,
        40,
        232,
        97
      ],
      "accounts": [
        {
          "name": "limitOrder",
          "writable": true
        },
        {
          "name": "orderVault",
          "writable": true
        },
        {
          "name": "userTokenIn",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "claimRushRewards",
      "docs": [
        "Claim accumulated RUSH rewards"
      ],
      "discriminator": [
        214,
        101,
        86,
        179,
        137,
        158,
        23,
        51
      ],
      "accounts": [
        {
          "name": "position",
          "writable": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "rushConfig",
          "writable": true
        },
        {
          "name": "rushMint",
          "writable": true
        },
        {
          "name": "userRushAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "rushMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createLimitOrder",
      "docs": [
        "Create a limit order"
      ],
      "discriminator": [
        76,
        161,
        70,
        122,
        82,
        20,
        142,
        75
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "limitOrder",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  109,
                  105,
                  116,
                  95,
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "sellTokenMint"
        },
        {
          "name": "userTokenIn",
          "writable": true
        },
        {
          "name": "userTokenOut",
          "writable": true
        },
        {
          "name": "orderVault",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sellAmount",
          "type": "u64"
        },
        {
          "name": "targetPrice",
          "type": "u64"
        },
        {
          "name": "minimumReceive",
          "type": "u64"
        },
        {
          "name": "expiryDays",
          "type": "i64"
        }
      ]
    },
    {
      "name": "executeLimitOrder",
      "docs": [
        "Execute a limit order"
      ],
      "discriminator": [
        52,
        33,
        60,
        30,
        47,
        100,
        40,
        22
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "limitOrder",
          "writable": true
        },
        {
          "name": "userTokenOut",
          "writable": true
        },
        {
          "name": "poolVaultOut",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "initializePool",
      "docs": [
        "Initialize a new liquidity pool"
      ],
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "tokenAMint"
              },
              {
                "kind": "account",
                "path": "tokenBMint"
              }
            ]
          }
        },
        {
          "name": "tokenAMint"
        },
        {
          "name": "tokenBMint"
        },
        {
          "name": "lpTokenMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "tokenAVault",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenBVault",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenA",
          "writable": true
        },
        {
          "name": "userTokenB",
          "writable": true
        },
        {
          "name": "lpTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "lpTokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "initialDepositA",
          "type": "u64"
        },
        {
          "name": "initialDepositB",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeRushToken",
      "docs": [
        "Initialize RUSH token and rewards system"
      ],
      "discriminator": [
        240,
        162,
        50,
        178,
        129,
        215,
        170,
        144
      ],
      "accounts": [
        {
          "name": "rushConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  115,
                  104,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "rushMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "marketBuy",
      "docs": [
        "Market buy: Buy token A with token B"
      ],
      "discriminator": [
        90,
        236,
        106,
        220,
        221,
        81,
        108,
        140
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "userTokenIn",
          "docs": [
            "User's USDC token account (input)"
          ],
          "writable": true
        },
        {
          "name": "userTokenOut",
          "docs": [
            "User's SOL token account (output)"
          ],
          "writable": true
        },
        {
          "name": "poolVaultIn",
          "docs": [
            "Pool's USDC vault (receives USDC)"
          ],
          "writable": true
        },
        {
          "name": "poolVaultOut",
          "docs": [
            "Pool's SOL vault (sends SOL)"
          ],
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "usdcAmount",
          "type": "u64"
        },
        {
          "name": "minSolReceived",
          "type": "u64"
        }
      ]
    },
    {
      "name": "marketSell",
      "docs": [
        "Market sell: Sell token A for token B"
      ],
      "discriminator": [
        11,
        224,
        159,
        119,
        129,
        127,
        145,
        237
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "userTokenIn",
          "docs": [
            "User's SOL token account (input)"
          ],
          "writable": true
        },
        {
          "name": "userTokenOut",
          "docs": [
            "User's USDC token account (output)"
          ],
          "writable": true
        },
        {
          "name": "poolVaultIn",
          "docs": [
            "Pool's SOL vault (receives SOL)"
          ],
          "writable": true
        },
        {
          "name": "poolVaultOut",
          "docs": [
            "Pool's USDC vault (sends USDC)"
          ],
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "solAmount",
          "type": "u64"
        },
        {
          "name": "minUsdcReceived",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pauseRushRewards",
      "docs": [
        "Pause or resume rewards distribution (admin only)"
      ],
      "discriminator": [
        124,
        156,
        220,
        127,
        0,
        42,
        225,
        64
      ],
      "accounts": [
        {
          "name": "rushConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "removeLiquidity",
      "docs": [
        "Remove liquidity from a pool"
      ],
      "discriminator": [
        80,
        85,
        209,
        72,
        24,
        206,
        177,
        108
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "lpTokenMint",
          "writable": true
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "tokenAVault",
          "writable": true
        },
        {
          "name": "tokenBVault",
          "writable": true
        },
        {
          "name": "userLpTokenAccount",
          "writable": true
        },
        {
          "name": "userTokenA",
          "writable": true
        },
        {
          "name": "userTokenB",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "lpTokensToBurn",
          "type": "u64"
        },
        {
          "name": "minAmountA",
          "type": "u64"
        },
        {
          "name": "minAmountB",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "docs": [
        "Execute a token swap"
      ],
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
        200
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "userTokenIn",
          "docs": [
            "User's input token account (from token based on is_a_to_b)"
          ],
          "writable": true
        },
        {
          "name": "userTokenOut",
          "docs": [
            "User's output token account (to token based on is_a_to_b)"
          ],
          "writable": true
        },
        {
          "name": "poolVaultIn",
          "docs": [
            "Pool's input token vault (receives input tokens)"
          ],
          "writable": true
        },
        {
          "name": "poolVaultOut",
          "docs": [
            "Pool's output token vault (sends output tokens)"
          ],
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minimumAmountOut",
          "type": "u64"
        },
        {
          "name": "isAToB",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateRushApy",
      "docs": [
        "Update RUSH APY (admin only)"
      ],
      "discriminator": [
        17,
        148,
        68,
        101,
        127,
        186,
        119,
        147
      ],
      "accounts": [
        {
          "name": "rushConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newApy",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "limitOrder",
      "discriminator": [
        137,
        183,
        212,
        91,
        115,
        29,
        141,
        227
      ]
    },
    {
      "name": "liquidityPool",
      "discriminator": [
        66,
        38,
        17,
        64,
        188,
        80,
        68,
        129
      ]
    },
    {
      "name": "rushConfig",
      "discriminator": [
        84,
        79,
        197,
        243,
        74,
        243,
        89,
        223
      ]
    },
    {
      "name": "userLiquidityPosition",
      "discriminator": [
        220,
        156,
        226,
        70,
        90,
        4,
        201,
        39
      ]
    }
  ],
  "events": [
    {
      "name": "limitOrderCancelled",
      "discriminator": [
        244,
        219,
        115,
        91,
        20,
        209,
        47,
        209
      ]
    },
    {
      "name": "limitOrderCreated",
      "discriminator": [
        90,
        152,
        6,
        18,
        137,
        223,
        10,
        110
      ]
    },
    {
      "name": "limitOrderExecuted",
      "discriminator": [
        230,
        96,
        79,
        110,
        208,
        225,
        214,
        243
      ]
    },
    {
      "name": "liquidityAdded",
      "discriminator": [
        154,
        26,
        221,
        108,
        238,
        64,
        217,
        161
      ]
    },
    {
      "name": "liquidityRemoved",
      "discriminator": [
        225,
        105,
        216,
        39,
        124,
        116,
        169,
        189
      ]
    },
    {
      "name": "poolCreated",
      "discriminator": [
        202,
        44,
        41,
        88,
        104,
        220,
        157,
        82
      ]
    },
    {
      "name": "rewardsClaimed",
      "discriminator": [
        75,
        98,
        88,
        18,
        219,
        112,
        88,
        121
      ]
    },
    {
      "name": "rewardsConfigUpdated",
      "discriminator": [
        104,
        85,
        46,
        239,
        155,
        224,
        9,
        57
      ]
    },
    {
      "name": "rewardsPaused",
      "discriminator": [
        127,
        0,
        46,
        254,
        176,
        222,
        51,
        158
      ]
    },
    {
      "name": "rushTokenInitialized",
      "discriminator": [
        96,
        232,
        1,
        153,
        204,
        207,
        190,
        92
      ]
    },
    {
      "name": "swapExecuted",
      "discriminator": [
        150,
        166,
        26,
        225,
        28,
        89,
        38,
        79
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidInitialDeposit",
      "msg": "Initial deposits must be greater than zero"
    },
    {
      "code": 6001,
      "name": "insufficientLiquidity",
      "msg": "Insufficient liquidity in pool"
    },
    {
      "code": 6002,
      "name": "slippageTooHigh",
      "msg": "Slippage tolerance exceeded"
    },
    {
      "code": 6003,
      "name": "invalidFeeParameters",
      "msg": "Invalid fee parameters"
    },
    {
      "code": 6004,
      "name": "calculationOverflow",
      "msg": "Overflow detected in calculation"
    },
    {
      "code": 6005,
      "name": "ratioImbalance",
      "msg": "Pool ratio imbalance exceeds tolerance"
    },
    {
      "code": 6006,
      "name": "insufficientBalance",
      "msg": "Insufficient user token balance"
    },
    {
      "code": 6007,
      "name": "insufficientLpBalance",
      "msg": "Insufficient LP token balance"
    },
    {
      "code": 6008,
      "name": "invalidAmount",
      "msg": "Invalid amount: must be greater than zero"
    },
    {
      "code": 6009,
      "name": "insufficientPoolReserves",
      "msg": "Insufficient pool reserves"
    },
    {
      "code": 6010,
      "name": "orderNotFound",
      "msg": "Limit order not found"
    },
    {
      "code": 6011,
      "name": "invalidOrderStatus",
      "msg": "Invalid order status for this operation"
    },
    {
      "code": 6012,
      "name": "orderExpired",
      "msg": "Limit order has expired"
    },
    {
      "code": 6013,
      "name": "unauthorizedOrderOwner",
      "msg": "Only order owner can cancel"
    },
    {
      "code": 6014,
      "name": "priceConditionNotMet",
      "msg": "Price condition not met for execution"
    },
    {
      "code": 6015,
      "name": "invalidExpiryTime",
      "msg": "Invalid expiry time"
    },
    {
      "code": 6016,
      "name": "pythPriceUnavailable",
      "msg": "Pyth price data unavailable"
    },
    {
      "code": 6017,
      "name": "stalePriceData",
      "msg": "Pyth price data is stale"
    },
    {
      "code": 6018,
      "name": "invalidAuthority",
      "msg": "Invalid authority - must be configured authority"
    }
  ],
  "types": [
    {
      "name": "limitOrder",
      "docs": [
        "LimitOrder Account Structure (Module 3.4)",
        "Stores a single limit order with price conditions and escrow",
        "",
        "Space: 8 (discriminator) + 32*4 + 8*5 + 8*2 + 1 + 1 = 181 bytes"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "sellToken",
            "type": "pubkey"
          },
          {
            "name": "buyToken",
            "type": "pubkey"
          },
          {
            "name": "sellAmount",
            "type": "u64"
          },
          {
            "name": "targetPrice",
            "type": "u64"
          },
          {
            "name": "minimumReceive",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "orderStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "limitOrderCancelled",
      "docs": [
        "Event emitted when a limit order is cancelled (Module 3.4)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "refundedAmount",
            "type": "u64"
          },
          {
            "name": "cancelledAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "limitOrderCreated",
      "docs": [
        "Event emitted when a limit order is created (Module 3.4)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "sellToken",
            "type": "pubkey"
          },
          {
            "name": "buyToken",
            "type": "pubkey"
          },
          {
            "name": "sellAmount",
            "type": "u64"
          },
          {
            "name": "targetPrice",
            "type": "u64"
          },
          {
            "name": "minimumReceive",
            "type": "u64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "limitOrderExecuted",
      "docs": [
        "Event emitted when a limit order is executed (Module 3.4)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "order",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "sellAmount",
            "type": "u64"
          },
          {
            "name": "receiveAmount",
            "type": "u64"
          },
          {
            "name": "executionPrice",
            "type": "u64"
          },
          {
            "name": "executedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "liquidityAdded",
      "docs": [
        "Event emitted when liquidity is added to a pool (Module 2.3)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "amountA",
            "type": "u64"
          },
          {
            "name": "amountB",
            "type": "u64"
          },
          {
            "name": "lpTokensMinted",
            "type": "u64"
          },
          {
            "name": "newReserveA",
            "type": "u64"
          },
          {
            "name": "newReserveB",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "liquidityPool",
      "docs": [
        "LiquidityPool Account Structure",
        "Represents a single trading pair pool (SOL/USDC or SOL/USDT)",
        "",
        "Space: 8 (discriminator) + 32*6 + 8*5 + 1 = 249 bytes"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tokenAMint",
            "type": "pubkey"
          },
          {
            "name": "tokenBMint",
            "type": "pubkey"
          },
          {
            "name": "tokenAVault",
            "type": "pubkey"
          },
          {
            "name": "tokenBVault",
            "type": "pubkey"
          },
          {
            "name": "lpTokenMint",
            "type": "pubkey"
          },
          {
            "name": "reserveA",
            "type": "u64"
          },
          {
            "name": "reserveB",
            "type": "u64"
          },
          {
            "name": "totalLpSupply",
            "type": "u64"
          },
          {
            "name": "feeNumerator",
            "type": "u64"
          },
          {
            "name": "feeDenominator",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "liquidityRemoved",
      "docs": [
        "Event emitted when liquidity is removed from a pool (Module 2.4)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "lpTokensBurned",
            "type": "u64"
          },
          {
            "name": "amountAReceived",
            "type": "u64"
          },
          {
            "name": "amountBReceived",
            "type": "u64"
          },
          {
            "name": "newReserveA",
            "type": "u64"
          },
          {
            "name": "newReserveB",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "orderStatus",
      "docs": [
        "OrderStatus Enum (Module 3.4)",
        "Tracks the lifecycle state of a limit order"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "executed"
          },
          {
            "name": "cancelled"
          },
          {
            "name": "expired"
          }
        ]
      }
    },
    {
      "name": "poolCreated",
      "docs": [
        "Event emitted when a new pool is created (Module 2.2)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "tokenAMint",
            "type": "pubkey"
          },
          {
            "name": "tokenBMint",
            "type": "pubkey"
          },
          {
            "name": "reserveA",
            "type": "u64"
          },
          {
            "name": "reserveB",
            "type": "u64"
          },
          {
            "name": "lpTokenSupply",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "rewardsClaimed",
      "docs": [
        "Event emitted when rewards are claimed (Module 4.4)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "position",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "rewardsAmount",
            "type": "u64"
          },
          {
            "name": "rewardsDisplay",
            "type": "f64"
          },
          {
            "name": "timeElapsed",
            "type": "i64"
          },
          {
            "name": "userLpShare",
            "type": "f64"
          },
          {
            "name": "claimedAt",
            "type": "i64"
          },
          {
            "name": "totalClaimedLifetime",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "rewardsConfigUpdated",
      "docs": [
        "Event emitted when rewards config is updated (Module 4.6)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "previousApyNumerator",
            "type": "u64"
          },
          {
            "name": "newApyNumerator",
            "type": "u64"
          },
          {
            "name": "newRewardsPerSecond",
            "type": "u64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "rewardsPaused",
      "docs": [
        "Event emitted when rewards are paused/resumed (Module 4.6)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "pausedAt",
            "type": "i64"
          },
          {
            "name": "pausedBy",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "rushConfig",
      "docs": [
        "RushConfig Account Structure",
        "Manages RUSH token configuration and rewards distribution settings",
        "",
        "Space: 8 (discriminator) + 32*2 + 8*6 + 2 = 122 bytes",
        "",
        "Module 4.1 - RUSH Token Configuration",
        "The RushConfig stores all settings for the RUSH token incentive mechanism.",
        "Key Properties:",
        "- Total Supply: 1,000,000 RUSH tokens (with 6 decimals = 1e12 base units)",
        "- Initial APY: 50% annually (50% of supply distributed in first year)",
        "- Yearly Rewards: 500,000 RUSH tokens",
        "- Reward Rate: ~15.85 RUSH per second (500,000 tokens / 31,536,000 seconds)",
        "- Distribution: Time-weighted rewards to liquidity providers (LPs)",
        "- Calculation: rewards_per_second = (total_supply * apy) / seconds_per_year",
        "= (1,000,000 * 50) / 100 / 31,536,000 = 15.85 RUSH/sec"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "mintedSoFar",
            "type": "u64"
          },
          {
            "name": "rewardsPerSecond",
            "type": "u64"
          },
          {
            "name": "apyNumerator",
            "type": "u64"
          },
          {
            "name": "apyDenominator",
            "type": "u64"
          },
          {
            "name": "startTimestamp",
            "type": "i64"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "rushTokenInitialized",
      "docs": [
        "Event emitted when RUSH token is initialized (Module 4.2)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rushMint",
            "type": "pubkey"
          },
          {
            "name": "rushConfig",
            "type": "pubkey"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "rewardsPerSecond",
            "type": "u64"
          },
          {
            "name": "apyNumerator",
            "type": "u64"
          },
          {
            "name": "apyDenominator",
            "type": "u64"
          },
          {
            "name": "startTimestamp",
            "type": "i64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "swapExecuted",
      "docs": [
        "Event emitted when a swap is executed (Module 3.1)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "amountIn",
            "type": "u64"
          },
          {
            "name": "amountOut",
            "type": "u64"
          },
          {
            "name": "feeAmount",
            "type": "u64"
          },
          {
            "name": "isAToB",
            "type": "bool"
          },
          {
            "name": "newReserveA",
            "type": "u64"
          },
          {
            "name": "newReserveB",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userLiquidityPosition",
      "docs": [
        "UserLiquidityPosition Account Structure",
        "Tracks individual user's LP token position and rewards",
        "",
        "Space: 8 (discriminator) + 32*2 + 8*4 + 1 = 113 bytes"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "lpTokens",
            "type": "u64"
          },
          {
            "name": "depositTimestamp",
            "type": "i64"
          },
          {
            "name": "lastClaimTimestamp",
            "type": "i64"
          },
          {
            "name": "totalRushClaimed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
