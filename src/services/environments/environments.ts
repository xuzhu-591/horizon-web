import {request} from 'umi';

export async function queryEnvironments() {
  return request<{
    data: CLUSTER.Environment[];
  }>(`/apis/core/v1/environments`, {
    method: 'GET',
  });
}

export async function queryRegions(environment: string) {
  return request<{
    data: CLUSTER.Region[];
  }>(`/apis/core/v1/environments/${environment}/regions`, {
    method: 'GET',
  });
}

export async function updateEnvironmentByID(id: number, environment: SYSTEM.Environment) {
  return request(`/apis/core/v1/environments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: environment
  });
}

export async function createEnvironment(environment: SYSTEM.Environment) {
  return request(`/apis/core/v1/environments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: environment
  });
}
