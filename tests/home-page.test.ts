import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Cedear } from '@/lib/cedears'
import {
  HOME_TABLE_LIMIT,
  buildTickerAzGroups,
  selectHomeTableCedears,
} from '@/lib/home-page'

function sample(ticker: string, volume: number | null): Cedear {
  return {
    Cedears: ticker,
    Name: ticker,
    Market: 'NYSE',
    Ratio: '1',
    TickerOriginal: ticker,
    tags: [],
    price: 100,
    pctChange: 1,
    volume,
    usPrice: 10,
    priceMep: null,
    priceCcl: null,
  }
}

describe('home-page helpers', () => {
  it('selectHomeTableCedears keeps top volume tickers', () => {
    const items = [
      sample('LOW', 10),
      sample('HIGH', 1000),
      sample('MID', 100),
    ]
    const picked = selectHomeTableCedears(items)
    assert.equal(picked.length, 3)
    assert.equal(picked[0].Cedears, 'HIGH')
    assert.equal(picked[1].Cedears, 'MID')
    assert.equal(picked[2].Cedears, 'LOW')
  })

  it(`selectHomeTableCedears caps at ${HOME_TABLE_LIMIT}`, () => {
    const items = Array.from({ length: 120 }, (_, i) =>
      sample(`T${i}`, i),
    )
    assert.equal(selectHomeTableCedears(items).length, HOME_TABLE_LIMIT)
  })

  it('buildTickerAzGroups sorts letters and tickers', () => {
    const groups = buildTickerAzGroups([
      sample('ZZZ', 1),
      sample('AAA', 1),
      sample('ABA', 1),
    ])
    assert.deepEqual(
      groups.map((g) => g.letter),
      ['A', 'Z'],
    )
    assert.deepEqual(groups[0].tickers, ['AAA', 'ABA'])
    assert.deepEqual(groups[1].tickers, ['ZZZ'])
  })
})
