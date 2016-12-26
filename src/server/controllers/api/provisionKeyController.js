/**
 * @file provisionKeyController.js
 * @author Zishan Iqbal
 * @description This file includes the implementation of the instance-provision key end-point
 */
import async from 'async';
import express from 'express';
const router = express.Router();

import BaseApiController from './baseApiController';
import FabricAccessTokenService from '../../services/fabricAccessTokenService';
import FabricProvisionKeyService from '../../services/fabricProvisionKeyService';
import FabricService from '../../services/fabricService';
import FabricUserService from '../../services/fabricUserService';
import UserService from '../../services/userService';

import AppUtils from '../../utils/appUtils';

router.get('/api/v2/authoring/fabric/provisionkey/instanceid/:instanceId', BaseApiController.checkfabricExistance, (req, res) => {
  var params = {},
      userProps = {
          userId: 'bodyParams.userId',
          setProperty: 'user'
      },
      createProvisionProps = {
          instanceId: 'bodyParams.instanceId',
          setProperty: 'newProvision'
      };

      params.bodyParams = req.params;
      params.bodyParams.userId = req.query;

  async.waterfall([
    async.apply(UserService.getUser, userProps, params),
    async.apply(FabricProvisionKeyService.createProvisonKeyByInstanceId, createProvisionProps)

  ], function(err, result) {
    AppUtils.sendResponse(res, err, 'provisionKey', params.newProvision.provisionKey, result);
  })
});

router.get('/api/v2/instance/provision/key/:provisionKey/fabrictype/:fabricType', (req, res) => {
  provisionFabricKey(req, res);
});

router.post('/api/v2/instance/provision/key/:provisionKey/fabrictype/:fabricType', (req, res) => {
  provisionFabricKey(req, res);
});

function provisionFabricKey(req, res) {
  var params = {},
      userProps = {
        userId: 'bodyParams.userId',
        setProperty: 'user'
      },
      provisionProps = {
        provisionKey: 'bodyParams.provisionKey',
        setProperty: 'fogProvision'
      },
      provisionKeyExpiryProps = {
        expirationTime: 'fogProvision.expirationTime'
      },
      fogProps = {
        fogId: 'fogProvision.iofabric_uuid',
        setProperty: 'fogData'
      },
      fogUserProps = {
        instanceId: 'fogData.uuid',
        setProperty: 'fogUser'
      },
      deleteTokenProps = {
        userId: 'fogUser.user_id'
      },
      saveFogAccessTokenProps = {
        userId: 'fogUser.user_id',
        expirationTime: 'tokenData.expirationTime',
        accessToken: 'tokenData.accessToken',
        setProperty: 'newAccessToken'
      };

  params.bodyParams = req.params;

  if(req.body.userId){
    params.bodyParams.userId = req.body.userId;
  }
  else{
    params.bodyParams.userId = req.query;
  }

  async.waterfall([
    async.apply(UserService.getUser, userProps, params),
    async.apply(FabricProvisionKeyService.getFogByProvisionKey, provisionProps),
    async.apply(FabricProvisionKeyService.deleteByProvisionKey, provisionProps),
    async.apply(FabricProvisionKeyService.checkProvisionKeyExpiry, provisionKeyExpiryProps),
    async.apply(FabricService.getFogInstance, fogProps),
    async.apply(FabricUserService.getFogUserByInstanceId, fogUserProps),
    FabricAccessTokenService.generateFogAccessToken,
    async.apply(FabricAccessTokenService.deleteFabricAccessTokenByUserId, deleteTokenProps),
    async.apply(FabricAccessTokenService.saveFogAccessToken,saveFogAccessTokenProps)

  ], function(err, result) {
    var successLabelArr= ['id', 'token'],
        successValueArr= [params.fogData.uuid, params.newAccessToken.token];

    AppUtils.sendMultipleResponse(res, err, successLabelArr, successValueArr, result);
  })
};

router.post('/api/v2/authoring/fabric/provisioningkey/list/delete', (req, res) => {
  var params = {},
      userProps = {
        userId: 'bodyParams.userId',
        setProperty: 'user'
      },
      instanceProps = {
        instanceId: 'bodyParams.instanceId',
      };

  params.bodyParams = req.body;

  async.waterfall([
    async.apply(UserService.getUser, userProps, params),
    async.apply(FabricProvisionKeyService.deleteProvisonKeyByInstanceId, instanceProps)
  
  ], function(err, result) {
       AppUtils.sendResponse(res, err, 'instanceId', params.bodyParams.instanceId, result);  
  });
});

export default router;