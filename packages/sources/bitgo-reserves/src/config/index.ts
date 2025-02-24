import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://reserves.gousd.com/por.json',
  },
  VERIFICATION_PUBKEY: {
    description:
      'Public RSA key used for verifying data signature. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\\n...contents...\\n-----END PUBLIC KEY-----"',
    type: 'string',
    required: true,
  },
})
