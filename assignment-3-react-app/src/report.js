import React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import jwt_decode from 'jwt-decode';
import {useParams} from 'react-router-dom';


export default function Report({accessToken, setAccessToken, refreshToken}) {

    const [reportTable, setReportTable] = useState(null);

    const { id } = useParams();

    const axiosToBeIntercepted = axios.create();
    axiosToBeIntercepted.interceptors.request.use(async function (config) {
        // try to refresh token
        // check if token is expired
        let decoded = jwt_decode(accessToken);
        let currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
            console.log("token expired");
            // send a request to auth server to refresh token and get new auth token
            const response = await axios.post('http://localhost:5000/requestNewAccessToken', {}, {
                headers: {
                    'auth-token-refresh': refreshToken,
                },
            })
            console.log(response.headers);
            setAccessToken(response.headers['auth-token-access']);
            config.headers['auth-token-access'] = response.headers['auth-token-access'];
        }
        return config;
    }, function (error) {
        return Promise.reject(error);
    });

    useEffect(() => {
        async function fetchReport() {
            const response = await axiosToBeIntercepted.get(`http://localhost:5000/report?id=${id}`, {
                headers: {
                    'auth-token-access': accessToken,
                },
            });
            console.log(response.data);
            setReportTable(response.data);
        }
        fetchReport();
    }, [id]);

  return (
    <div>
      Report {id}
      {
         (reportTable) &&
         reportTable
      }
    </div>
  )
}
