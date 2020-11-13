import objectPath from 'object-path'
import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { Config, DEFAULT_DATA_PATH, getBaseURL } from '../config'
import { CoinType, ChainType } from '.'

export const Name = 'balance'

type Address = {
  address: string
  coin?: CoinType
  chain?: ChainType
  balance?: number
}

type RequestData = {
  dataPath: string
  confirmations: number
}

type ResponseWithResult = {
  response?: any
  result?: Address
}

const WARNING_NO_OPERATION = 'No Operation: only btc mainnet is supported by BTC.com adapter'
const WARNING_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'

const getBalanceURI = (address: string) => `/v3/address/${address}`

const toBalances = async (config: Config, addresses: Address[]): Promise<ResponseWithResult[]> =>
  Promise.all(
    addresses.map(async (addr: Address) => {
      if (!addr.address) return { ...addr, warning: WARNING_NO_OPERATION_MISSING_ADDRESS }

      if (!addr.coin) addr.coin = 'btc'
      if (addr.coin !== 'btc') return { ...addr, warning: WARNING_NO_OPERATION }
      if (!addr.chain) addr.chain = 'mainnet'
      if (addr.chain !== 'mainnet') return { ...addr, warning: WARNING_NO_OPERATION }

      const reqConfig = {
        ...config.api,
        baseURL: getBaseURL(),
        url: getBalanceURI(addr.address),
      }

      const response = await Requester.request(reqConfig)

      return {
        response: response.data,
        result: { ...addr, balance: response.data.data.balance },
      }
    }),
  )

const reduceResponse = (responses: ResponseWithResult[]) =>
  responses.reduce(
    (accumulator, current) => {
      accumulator.data.responses = [...accumulator.data.responses, current.response]
      accumulator.data.result = [...accumulator.data.result, current.result]
      return accumulator
    },
    {
      data: { responses: [], result: [] },
      status: 200,
    } as any,
  )

export const inputParams = {
  dataPath: false,
  confirmations: false,
}

// Export function to integrate with Chainlink node
export const execute = async (config: Config, request: AdapterRequest): Promise<Address[]> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const data: RequestData = validator.validated.data
  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  const inputData = <Address[]>objectPath.get(request.data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
    throw Requester.errored(
      jobRunID,
      `Input, at '${dataPath}' path, must be a non-empty array.`,
      400,
    )

  const responses = await toBalances(config, inputData)
  return reduceResponse(responses)
}
