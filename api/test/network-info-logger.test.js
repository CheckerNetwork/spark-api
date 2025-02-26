import assert from 'node:assert'
import { createTelemetryRecorderStub } from '../../test-helpers/platform-test-helpers.js'
import { clearNetworkInfoStationIdsSeen, logNetworkInfo } from '../lib/network-info-logger.js'

describe('logNetworkInfo', () => {
  const headers1 = {
    'cf-ipcity': 'city1',
    'cf-ipcountry': 'country1',
    'cf-ipcontinent': 'continent1',
    'cf-iplongitude': 'longitude1',
    'cf-iplatitude': 'latitude1',
    'cf-region': 'region1',
    'cf-region-code': 'region-code1',
    'cf-timezone': 'timezone1'
  }
  const headers2 = {
    'cf-ipcity': 'city2',
    'cf-ipcountry': 'country2',
    'cf-ipcontinent': 'continent2',
    'cf-iplongitude': 'longitude2',
    'cf-iplatitude': 'latitude2',
    'cf-region': 'region2',
    'cf-region-code': 'region-code2',
    'cf-timezone': 'timezone2'
  }
  const headers3 = {
    'cf-ipcity': 'city3',
    'cf-ipcountry': 'country3',
    'cf-ipcontinent': 'continent3',
    'cf-iplongitude': 'longitude3',
    'cf-iplatitude': 'latitude3',
    'cf-region': 'region3',
    'cf-region-code': 'region-code3',
    'cf-timezone': 'timezone3'
  }

  beforeEach(async () => {
    clearNetworkInfoStationIdsSeen()
  })

  it('should record new network info if not present for the day', async () => {
    const { recordTelemetry, telemetry } = createTelemetryRecorderStub()

    await logNetworkInfo(headers1, 'station-id1', recordTelemetry)
    await logNetworkInfo(headers2, 'station-id2', recordTelemetry)
    // another request from a Station ID we have already seen today
    await logNetworkInfo(headers3, 'station-id1', recordTelemetry)

    const expectedFields1 = {}
    for (const key in headers1) {
      expectedFields1[key] = `"${headers1[key]}"`
    }
    const expectedFields2 = {}
    for (const key in headers2) {
      expectedFields2[key] = `"${headers2[key]}"`
    }

    assert.deepStrictEqual(
      // @ts-ignore
      telemetry.map(p => ({ _point: p.name, ...p.fields })),
      [
        { _point: 'network-info', ...expectedFields1 },
        { _point: 'network-info', ...expectedFields2 }
      ]
    )
  })

  it('should clear station IDs seen when clearNetworkInfoStationIdsSeen is called', async () => {
    const { recordTelemetry, telemetry } = createTelemetryRecorderStub()

    await logNetworkInfo(headers1, 'station-id1', recordTelemetry)

    // Try to log again for station-id1 (should not record)
    await logNetworkInfo(headers2, 'station-id1', recordTelemetry)

    clearNetworkInfoStationIdsSeen()

    // Log again for station-id1 (should record now)
    await logNetworkInfo(headers3, 'station-id1', recordTelemetry)

    assert.strictEqual(telemetry.length, 2)
    assert.deepStrictEqual(
      // @ts-ignore
      telemetry.map(p => ({ _point: p.name, 'cf-ipcity': p.fields['cf-ipcity'] })),
      [
        { _point: 'network-info', 'cf-ipcity': '"city1"' },
        { _point: 'network-info', 'cf-ipcity': '"city3"' }
      ]
    )
  })
})
