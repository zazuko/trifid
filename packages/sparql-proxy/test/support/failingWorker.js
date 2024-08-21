import { stub } from 'sinon'
import fetch from '../../lib/fetchServiceDescription.js'

fetch.fetchServiceDescription = stub().rejects(new Error('Failed to fetch service description'))

import('../../lib/serviceDescriptionWorker.js')
