import { useCallback, useContext } from 'react';

import { BACKEND_URL, REDIRECT_URI } from '@/config';
import { JwtContext } from '@/contexts/jwt';
import { useVincentWebAuthClient } from '@/hooks/useVincentWebAuthClient';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Schedule = {
  lastRunAt: string;
  nextRunAt: string;
  lastFinishedAt: string;
  failedAt: string;
  _id: string;
  disabled: boolean;
  failReason: string;
  data: {
    name: string;
    purchaseIntervalHuman: string;
    walletAddress: string;
    updatedAt: string;
  };
};

export interface CreateScheduleRequest {
  name: string;
  purchaseIntervalHuman: string;
}

export const useBackend = () => {
  const { authInfo } = useContext(JwtContext);
  const vincentWebAppClient = useVincentWebAuthClient();

  const getJwt = useCallback(() => {
    // Redirect to Vincent Auth consent page with appId and version
    vincentWebAppClient.redirectToDelegationAuthPage({
      // delegationAuthPageUrl: `http://localhost:3000/`,
      redirectUri: REDIRECT_URI,
    });
  }, [vincentWebAppClient]);

  const sendRequest = useCallback(
    async <T>(endpoint: string, method: HTTPMethod, body?: unknown): Promise<T> => {
      if (!authInfo?.jwt) {
        throw new Error('No JWT to query backend');
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authInfo.jwt}`,
      };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as { data: T; success: boolean };

      if (!json.success) {
        throw new Error(`Backend error: ${json.data}`);
      }

      return json.data;
    },
    [authInfo]
  );

  const createSchedule = useCallback(
    async (schedule: CreateScheduleRequest) => {
      return sendRequest<Schedule>('/schedule', 'POST', schedule);
    },
    [sendRequest]
  );

  const getSchedules = useCallback(async () => {
    return sendRequest<Schedule[]>('/schedules', 'GET');
  }, [sendRequest]);

  const disableSchedule = useCallback(
    async (scheduleId: string) => {
      return sendRequest<Schedule>(`/schedules/${scheduleId}/disable`, 'PUT');
    },
    [sendRequest]
  );

  const enableSchedule = useCallback(
    async (scheduleId: string) => {
      return sendRequest<Schedule>(`/schedules/${scheduleId}/enable`, 'PUT');
    },
    [sendRequest]
  );

  const editSchedule = useCallback(
    async (scheduleId: string, schedule: CreateScheduleRequest) => {
      return sendRequest<Schedule>(`/schedules/${scheduleId}`, 'PUT', schedule);
    },
    [sendRequest]
  );

  const deleteSchedule = useCallback(
    async (scheduleId: string) => {
      return sendRequest<Schedule>(`/schedules/${scheduleId}`, 'DELETE');
    },
    [sendRequest]
  );

  return {
    createSchedule,
    deleteSchedule,
    disableSchedule,
    editSchedule,
    enableSchedule,
    getSchedules,
    getJwt,
  };
};
