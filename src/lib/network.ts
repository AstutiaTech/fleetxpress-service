"use client"

import type { AxiosRequestConfig, AxiosResponse } from "axios"
import { decrypt, encrypt } from "./encryption"

import axiosInstance from "./axios"

// Type for query parameters
export type QueryParams = Record<string, string | number | boolean | undefined | null>

// Network utility class
class NetworkUtils {
  /**
   * Perform a GET request
   * @param url - The URL to request
   * @param params - Query parameters
   * @param config - Additional Axios config
   */
  static async get<T = unknown>(url: string, params?: QueryParams, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.get(url, {
      params,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...config?.headers,
      },
      ...config,
    })
    // const encryptedResponse = response.data as { data: string; iv: string; tag: string };
    // const decryptedResponse = JSON.parse(decrypt(encryptedResponse));
    return response.data
  }

  /**
   * Perform a POST request
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Additional Axios config
   */
  static async post<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    console.log('request: ', data);
    // const encryptedRequest = encrypt(JSON.stringify(data));
    const response: AxiosResponse<T> = await axiosInstance.post(url, data, config)

    // Decrypted response
    // const encryptedResponse = response.data as { data: string; iv: string; tag: string };
    // const decryptedResponse = JSON.parse(decrypt(encryptedResponse));
    // console.log('response', decryptedResponse);
    return response.data;
  }

  /**
   * Perform a PUT request
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Additional Axios config
   */
  static async put<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.put(url, data, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...config?.headers,
      },
      ...config,
    })
    return response.data
  }

  /**
   * Perform a PATCH request
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Additional Axios config
   */
  static async patch<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.patch(url, data, config)
    return response.data
  }

  /**
   * Perform a DELETE request
   * @param url - The URL to request
   * @param config - Additional Axios config
   */
  static async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.delete(url, config)
    return response.data
  }

  /**
   * Upload a file with progress tracking
   * @param url - The URL to upload to
   * @param file - The file to upload
   * @param onProgress - Progress callback (0-100)
   * @param config - Additional Axios config
   */
  static async uploadFile<T = unknown>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData()
    formData.append("file", file)

    const response: AxiosResponse<T> = await axiosInstance.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
      ...config,
    })

    return response.data
  }

  /**
   * Upload multiple files with progress tracking
   * @param url - The URL to upload to
   * @param files - Array of files to upload
   * @param onProgress - Progress callback (0-100)
   * @param config - Additional Axios config
   */
  static async uploadMultipleFiles<T = unknown>(
    url: string,
    files: File[],
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    const response: AxiosResponse<T> = await axiosInstance.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
      ...config,
    })

    return response.data
  }
}

export default NetworkUtils

