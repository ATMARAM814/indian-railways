// stationIntelligence.service.js
import apiClient from '../api/apiClient';

export const getScopedStations = async (filters = {}) => {
  const res = await apiClient.get('/stations', { params: filters });
  return res.data;
};

export const getStationIntelligence = async (stationId) => {
  const res = await apiClient.get(`/stations/${stationId}/intelligence`);
  return res.data;
};

export const getCategoryCandidates = async (stationId, category) => {
  const res = await apiClient.get(`/stations/${stationId}/category-candidates`, { params: { category } });
  return res.data;
};

export const createStation = async (stationData) => {
  const res = await apiClient.post('/stations', stationData);
  return res.data;
};
