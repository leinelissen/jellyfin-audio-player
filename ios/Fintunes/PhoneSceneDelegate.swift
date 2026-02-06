import UIKit
import React_RCTAppDelegate

class PhoneSceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  
  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    
    // Get the AppDelegate to access the React Native setup
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    
    // Create the window for this scene
    let window = UIWindow(windowScene: windowScene)
    
    // Start React Native if not already started
    if let factory = appDelegate.reactNativeFactory {
      factory.startReactNative(
        withModuleName: "Fintunes",
        in: window,
        launchOptions: nil
      )
    }
    
    self.window = window
    window.makeKeyAndVisible()
  }
}
