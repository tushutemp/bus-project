import React from 'react'
import DriverDashboard from './DriverDashboard'
import SOSAlert from './SOSAlert'
import TripControls from './TripControls'
const License = () => {
  return (
    <div>
      <input><textarea name="license" id="number"></textarea></input>
      <button>submit</button>
    </div>
  )
}

export default License
