import "./App.css";
import Banner from "./Banner";
import logo from './assets/logo.png';
function App() {
  return (
      <main className="app-background">
        <img src={logo}
        style ={{width:'500px', height:'300px'}}
        />
        <p>
          Welcome to SprintWheel, your agile project management tool designed
          to streamline your workflow and enhance team collaboration. With
          SprintWheel, you can easily plan, track, and manage your sprints,
          ensuring that your projects stay on track and your team stays productive.
        <h2>Login</h2>
        <h3>Username:</h3>
        <Banner>
        </Banner>
        <h4>Password:</h4>
        <Banner>
        </Banner>

      <h1>SprintWheel</h1>
      <h4>Presented By: Stack Overthrow </h4>
        </p> 
      </main>
  );
      <p>Welcome to SprintWheel, your agile project management tool designed to streamline your workflow and enhance team collaboration. With SprintWheel, you can easily plan, track, and manage your sprints, ensuring that your projects stay on track and your team stays productive.</p>
      <h2>Login</h2>

      <h2>Sign Up</h2>
    
    </main>
  
  )
}

export default App;
