import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	// NodeParameterValue,
	IRequestOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { ILoadOptionsFunctions } from 'n8n-workflow/dist/Interfaces';

interface CustomProperty {
	name: string;
	value: string;
}

// interface FilterValue {
// 	operation: string;
// 	value: NodeParameterValue;
// }
// interface FilterValues {
// 	[key: string]: FilterValue[];
// }

export class FractalForge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fractal Forge',
		documentationUrl: 'https://fractalforge.dev',
		name: 'fractalForge',
		icon: 'file:fractal_forge.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["collection"] + ": " + $parameter["operation"]}} object',
		description: 'Retrieve data from FractalForge API',
		defaults: {
			name: 'Fractal Forge Action',
		},
		// @ts-ignore
		inputs: ['main'],
		// @ts-ignore
		outputs: ['main'],
		credentials: [
			{
				name: 'fractalForgeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Command',
						value: 'command',
					},
					{
						name: 'Query',
						value: 'query',
					},
				],
				default: 'query',
			},

			// ----------------------------------
			//         command
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['command'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create an object',
						action: 'Create an object',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an object',
						action: 'Update an object',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an object',
						action: 'Delete an object',
					},
					{
						name: 'Custom (Collection)',
						value: 'custom_collection_command',
						description: 'Custom command on a collection',
						action: 'Custom command on a collection',
					},
					{
						name: 'Custom (Object)',
						value: 'custom_object_command',
						description: 'Custom command on an object',
						action: 'Custom command on an object',
					},
				],
				default: 'create',
			},

			// ----------------------------------
			//         query
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['query'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'List objects',
						action: 'List objects',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an object',
						action: 'Get an object',
					},
					{
						name: 'Custom (Collection)',
						value: 'custom_collection_query',
						description: 'Custom query on a collection',
						action: 'Custom query on a collection',
					},
					{
						name: 'Custom (Object)',
						value: 'custom_object_query',
						description: 'Custom query on an object',
						action: 'Custom query on an object',
					},
				],
				default: 'get',
			},

			// ----------------------------------
			//         properties
			// ----------------------------------
			{
				displayName: 'Entity Collection Name or ID',
				name: 'collection',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getFractalEntities',
				},
				required: true,
				default: '',
				description: 'Select an entity collection. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Object ID',
				name: 'objectId',
				description: 'The ID of the object',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['command'],
						operation: ['create'],
					},
				},
				placeholder: '00000000-0000-0000-0000-000000000000',
			},
			{
				displayName: 'Object ID',
				name: 'objectId',
				description: 'The ID of the object',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['command', 'query'],
						operation: ['update', 'delete', 'get', 'custom_object_command', 'custom_object_query'],
					},
				},
				placeholder: '00000000-0000-0000-0000-000000000000',
			},
			{
				displayName: 'Custom Command',
				name: 'customCommand',
				description: 'The name of the custom command',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['command'],
						operation: ['custom_object_command', 'custom_collection_command'],
					},
				},
				placeholder: 'custom-command',
			},
			{
				displayName: 'Custom Query',
				name: 'customQuery',
				description: 'The name of the custom query',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['query'],
						operation: ['custom_object_query', 'custom_collection_query'],
					},
				},
				placeholder: 'custom-query',
			},
			{
				displayName: 'JSON',
				name: 'jsonBody',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['command'],
						operation: ['create', 'update'],
					},
				},
				// displayOptions: {
				// 	show: {
				// 		sendBody: [true],
				// 		contentType: ['json'],
				// 		specifyBody: ['json'],
				// 		operation: ['command'],
				// 		resource: ['update'],
				// 	},
				// },
				default: '={{ JSON.stringify($json || "") }}',
			},
		],
	};

	methods = {
		loadOptions: {
			async getFractalEntities(this: ILoadOptionsFunctions) {
				const credentials = await this.getCredentials('fractalForgeApi');
				const apiEndpoint = credentials.apiEndpoint;
				const apiKey = credentials.apiKey;

				const options = {
					method: 'GET',
					uri: `${apiEndpoint}/system/commands-events-per-entity`,
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
					json: true,
				} as IRequestOptions;

				const response = await this.helpers.request(options);

				return Object.keys(response).map((entity: string) => ({
					name: entity,
					value: response[entity].path,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// const credentials = await this.getCredentials('fractalForgeApi');
		// const baseUrl = `https://${credentials.accountName}.fractalForge.com/api/v2`;

		const removeTrailingSlash = (url: string): string => {
			return url.endsWith('/') ? url.slice(0, -1) : url;
		};

		const credentials = await this.getCredentials('fractalForgeApi');
		const apiEndpoint = removeTrailingSlash(credentials.apiEndpoint as string);
		const apiKey = credentials.apiKey;

		// For Post
		let body: IDataObject;
		// For Query string
		let qs: IDataObject;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i);
				const operation = this.getNodeParameter('operation', i);
				const entityCollection = this.getNodeParameter('collection', i) as string;

				let requestMethod: IHttpRequestMethods = 'GET';
				let endpoint = '';
				body = {};
				qs = {};
				if (resource === 'query') {
					if (operation === 'list' || operation === 'custom_collection_query') {
						// ----------------------------------
						//         list
						// ----------------------------------

						requestMethod = 'GET';

						const customQuery = this.getNodeParameter('customQuery', i, '') as IDataObject;

						endpoint = entityCollection;

						if (customQuery) {
							endpoint = `${endpoint}/${customQuery}`;
						}
					} else if (operation === 'get' || operation === 'custom_object_query') {
						// ----------------------------------
						//         get
						// ----------------------------------

						requestMethod = 'GET';

						const objectId = this.getNodeParameter('objectId', i, '') as IDataObject;
						const customQuery = this.getNodeParameter('customQuery', i, '') as IDataObject;

						endpoint = `${entityCollection}/${objectId}`;
						if (customQuery) {
							endpoint = `${endpoint}/${customQuery}`;
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not known!`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'command') {
					if (operation === 'create') {
						// ----------------------------------
						//         create
						// ----------------------------------

						requestMethod = 'POST';

						body = JSON.parse(this.getNodeParameter('jsonBody', i, '') as string);

						const properties = this.getNodeParameter('properties', i, {}) as IDataObject;

						for (const key of Object.keys(properties)) {
							if (
								key === 'customProperties' &&
								(properties.customProperties as IDataObject).property !== undefined
							) {
								for (const customProperty of (properties.customProperties as IDataObject)
									.property! as CustomProperty[]) {
									qs[customProperty.name] = customProperty.value;
								}
							} else {
								qs[key] = properties[key];
							}
						}

						const objectId = this.getNodeParameter('objectId', i, '') as string;

						endpoint = objectId.trim() !== '' ? `${entityCollection}/${objectId}` : entityCollection;
					} else if (operation === 'update') {
						// ----------------------------------
						//         update
						// ----------------------------------

						requestMethod = 'PUT';

						body = JSON.parse(this.getNodeParameter('jsonBody', i, '') as string);

						const properties = this.getNodeParameter('properties', i, {}) as IDataObject;

						for (const key of Object.keys(properties)) {
							if (
								key === 'customProperties' &&
								(properties.customProperties as IDataObject).property !== undefined
							) {
								for (const customProperty of (properties.customProperties as IDataObject)
									.property! as CustomProperty[]) {
									qs[customProperty.name] = customProperty.value;
								}
							} else {
								qs[key] = properties[key];
							}
						}

						const objectId = this.getNodeParameter('objectId', i, '') as IDataObject;

						endpoint = `${entityCollection}/${objectId}`;
					} else if (operation === 'delete') {
						// ----------------------------------
						//         delete
						// ----------------------------------

						requestMethod = 'DELETE';

						const properties = this.getNodeParameter('properties', i, {}) as IDataObject;

						for (const key of Object.keys(properties)) {
							if (
								key === 'customProperties' &&
								(properties.customProperties as IDataObject).property !== undefined
							) {
								for (const customProperty of (properties.customProperties as IDataObject)
									.property! as CustomProperty[]) {
									qs[customProperty.name] = customProperty.value;
								}
							} else {
								qs[key] = properties[key];
							}
						}

						const objectId = this.getNodeParameter('objectId', i, '') as IDataObject;

						endpoint = `${entityCollection}/${objectId}`;
					} else if (operation === 'custom_object_command' || operation === 'custom_collection_command') {
						// ----------------------------------
						//         custom
						// ----------------------------------

						requestMethod = 'POST';

						const properties = this.getNodeParameter('properties', i, {}) as IDataObject;

						for (const key of Object.keys(properties)) {
							if (
								key === 'customProperties' &&
								(properties.customProperties as IDataObject).property !== undefined
							) {
								for (const customProperty of (properties.customProperties as IDataObject)
									.property! as CustomProperty[]) {
									qs[customProperty.name] = customProperty.value;
								}
							} else {
								qs[key] = properties[key];
							}
						}

						const objectId = this.getNodeParameter('objectId', i, '') as IDataObject;
						const customCommand = this.getNodeParameter('customCommand', i, '') as IDataObject;

						endpoint = entityCollection;
						if (operation === 'custom_object_command') {
							endpoint = `${endpoint}/${objectId}`;
						}
						if (customCommand) {
							endpoint = `${endpoint}/${customCommand}`;
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not known!`,
							{ itemIndex: i },
						);
					}
				// } else if (resource === 'invoice') {
				// 	if (operation === 'list') {
				// 		// ----------------------------------
				// 		//         list
				// 		// ----------------------------------
				//
				// 		endpoint = 'invoices';
				// 		// TODO: Make also sorting configurable
				// 		qs['sort_by[desc]'] = 'date';
				//
				// 		qs.limit = this.getNodeParameter('maxResults', i, {});
				//
				// 		const setFilters: FilterValues = this.getNodeParameter(
				// 			'filters',
				// 			i,
				// 			{},
				// 		) as unknown as FilterValues;
				//
				// 		let filter: FilterValue;
				// 		let value: NodeParameterValue;
				//
				// 		for (const filterProperty of Object.keys(setFilters)) {
				// 			for (filter of setFilters[filterProperty]) {
				// 				value = filter.value;
				// 				if (filterProperty === 'date') {
				// 					value = Math.floor(new Date(value as string).getTime() / 1000);
				// 				}
				// 				qs[`${filterProperty}[${filter.operation}]`] = value;
				// 			}
				// 		}
				// 	} else if (operation === 'pdfUrl') {
				// 		// ----------------------------------
				// 		//         pdfUrl
				// 		// ----------------------------------
				//
				// 		requestMethod = 'POST';
				// 		const invoiceId = this.getNodeParameter('invoiceId', i) as string;
				// 		endpoint = `invoices/${invoiceId.trim()}/pdf`;
				// 	} else {
				// 		throw new NodeOperationError(
				// 			this.getNode(),
				// 			`The operation "${operation}" is not known!`,
				// 			{ itemIndex: i },
				// 		);
				// 	}
				// } else if (resource === 'subscription') {
				// 	if (operation === 'cancel') {
				// 		// ----------------------------------
				// 		//         cancel
				// 		// ----------------------------------
				//
				// 		requestMethod = 'POST';
				//
				// 		const subscriptionId = this.getNodeParameter('subscriptionId', i, '') as string;
				// 		body.end_of_term = this.getNodeParameter('endOfTerm', i, false) as boolean;
				//
				// 		endpoint = `subscriptions/${subscriptionId.trim()}/cancel`;
				// 	} else if (operation === 'delete') {
				// 		// ----------------------------------
				// 		//         delete
				// 		// ----------------------------------
				//
				// 		requestMethod = 'POST';
				//
				// 		const subscriptionId = this.getNodeParameter('subscriptionId', i, '') as string;
				//
				// 		endpoint = `subscriptions/${subscriptionId.trim()}/delete`;
				// 	} else {
				// 		throw new NodeOperationError(
				// 			this.getNode(),
				// 			`The operation "${operation}" is not known!`,
				// 			{ itemIndex: i },
				// 		);
				// 	}
				} else {
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known!`, {
						itemIndex: i,
					});
				}

				const options = {
					method: requestMethod,
					qs: qs,
					uri: `${apiEndpoint}/${endpoint}`,
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
					json: true,
				} as IRequestOptions;

				if (requestMethod !== 'GET') {
					options.body = body;
				}

				let responseData;

				try {
					responseData = await this.helpers.request(options);
				} catch (error) {
					throw new NodeApiError(this.getNode(), error as JsonObject);
				}

				// if (resource === 'invoice' && operation === 'list') {
				// 	responseData.list.forEach((data: IDataObject) => {
				// 		responseData = this.helpers.constructExecutionMetaData(
				// 			this.helpers.returnJsonArray({ ...(data.invoice as IDataObject) }),
				// 			{ itemData: { item: i } },
				// 		);
				// 		returnData.push(...responseData);
				// 	});
				// } else if (resource === 'invoice' && operation === 'pdfUrl') {
				// 	const data: IDataObject = {};
				// 	Object.assign(data, items[i].json);
				//
				// 	data.pdfUrl = responseData.download.download_url;
				// 	responseData = this.helpers.constructExecutionMetaData(
				// 		this.helpers.returnJsonArray({ ...data }),
				// 		{ itemData: { item: i } },
				// 	);
				// 	returnData.push(...responseData);
				// } else {
				responseData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...responseData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message, json: {}, itemIndex: i });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
