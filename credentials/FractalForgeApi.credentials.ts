import {
	ICredentialType,
	INodeProperties,
	IAuthenticateGeneric, Icon,
} from 'n8n-workflow';

export class FractalForgeApi implements ICredentialType {
	name = 'fractalForgeApi';
	icon = 'file:fractal_forge.svg' as Icon;
	displayName = 'Fractal Forge API';
	documentationUrl = 'https://fractalforge.dev';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Enter your Fractal Forge application API Key',
			required: true,
		},
		{
			displayName: 'API Endpoint',
			name: 'apiEndpoint',
			type: 'string',
			default: 'http://127.0.0.1:8000',
			required: true,
		},
		{
			displayName: 'Label',
			name: 'api',
			type: 'string',
			default: 'My Fractal Forge Application',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}'
			},
		},
	};
}
