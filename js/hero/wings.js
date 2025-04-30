import * as THREE from "three";

export default class Wings extends THREE.Object3D {
  constructor() {
    super();
    const modelGroup = new THREE.Group();

    // Create beautiful angel wings for the hero
    // Create a more beautiful wing shape with enhanced curves
    // Create wing geometry from the shape
    const wingShape = this.createWingShape();
    const wingGeometry = new THREE.ShapeGeometry(wingShape, 32); // Higher segment count for smoother curves

    // Create a beautiful pure white wing material with enhanced glow
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure white
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92, // More opaque
      emissive: 0xffffff, // Pure white glow
      emissiveIntensity: 0.5, // Stronger glow
      metalness: 0.05, // Less metallic
      roughness: 0.2, // Smoother
    });

    // Create left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.15, 0.3, 0); // Closer to body
    leftWing.scale.set(0.4, 0.4, 0.4); // Smaller size (reduced from 0.6)

    // Create right wing (mirror of left wing)
    const rightWing = leftWing.clone();
    rightWing.position.set(0.15, 0.3, 0); // Closer to body
    rightWing.scale.set(-0.4, 0.4, 0.4); // Mirror by scaling X negatively, smaller size

    // Add feather details to make wings more beautiful
    this.addFeatherDetails(leftWing, -1);
    this.addFeatherDetails(rightWing, 1);

    // Add wings to group
    modelGroup.add(leftWing);
    modelGroup.add(rightWing);

    // Position wings on hero's back - higher up and further back
    modelGroup.position.set(0, 1.3, 0.35);

    // Add slight angle to wings
    modelGroup.rotation.x = 0.1;

    modelGroup.visible = true;

    modelGroup.setVisible = (visible) => {
      modelGroup.visible = visible;
    };

    modelGroup.isVisible = () => modelGroup.visible;

    return modelGroup;
  }

  createWingShape() {
    const shape = new THREE.Shape();

    // Starting point at the base
    shape.moveTo(0, 0);

    // Top curve - more elegant arc upward with sharper curve
    shape.bezierCurveTo(
      -0.2,
      0.3, // control point 1 - closer to base for sharper curve
      -0.5,
      0.7, // control point 2
      -0.7,
      1.3 // end point - wing tip, slightly longer
    );

    // Middle feathers curve - more pronounced
    shape.bezierCurveTo(
      -0.65,
      1.0, // control point 1
      -0.8,
      0.7, // control point 2
      -0.9,
      0.5 // end point - middle feather
    );

    // Lower middle feathers - adding more detail
    shape.bezierCurveTo(
      -0.85,
      0.4, // control point 1
      -0.8,
      0.3, // control point 2
      -0.7,
      0.2 // end point
    );

    // Lower feathers curve - more detailed
    shape.bezierCurveTo(
      -0.6,
      0.1, // control point 1
      -0.5,
      0.0, // control point 2
      -0.3,
      -0.1 // end point - lower feather
    );

    // Return to base with a gentle curve
    shape.bezierCurveTo(
      -0.2,
      -0.05, // control point 1
      -0.1,
      0.0, // control point 2
      0,
      0 // end point - back to base
    );

    return shape;
  }

  addFeatherDetails(wing, side) {
    // Add beautiful feather details to the wings
    const featherCount = 7; // Increased feather count for more detail
    const featherGroup = new THREE.Group();

    // Create several individual feathers
    for (let i = 0; i < featherCount; i++) {
      // Create a curved feather shape
      const featherShape = new THREE.Shape();

      // Base of feather
      const baseX = 0;
      const baseY = i * 0.12; // Stagger feathers vertically, closer together

      featherShape.moveTo(baseX, baseY);

      // Feather curve - each one slightly different with more curve
      const length = 0.3 + i * 0.07; // Slightly shorter feathers (was 0.4)
      const width = 0.06 - i * 0.005; // Thinner feathers (was 0.08)

      // More curved feather shape
      featherShape.bezierCurveTo(
        baseX + side * length * 0.2,
        baseY + width * 1.2,
        baseX + side * length * 0.5,
        baseY + width * 2.5,
        baseX + side * length,
        baseY + width * 1.5
      );

      // Return to base with a more elegant curve
      featherShape.bezierCurveTo(
        baseX + side * length * 0.8,
        baseY - width * 0.5,
        baseX + side * length * 0.4,
        baseY - width * 1.5,
        baseX,
        baseY
      );

      // Create geometry from shape
      const featherGeometry = new THREE.ShapeGeometry(featherShape, 16); // More segments

      // Create material with slight variation for each feather - pure white
      const whiteness = 0.98 + i * 0.005; // Less variation, more consistently white
      const featherMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(whiteness, whiteness, whiteness),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9 - i * 0.03, // Less transparent overall
        emissive: 0xffffff, // Pure white glow
        emissiveIntensity: 0.4 - i * 0.02, // Stronger glow
      });

      // Create feather mesh
      const feather = new THREE.Mesh(featherGeometry, featherMaterial);
      feather.renderOrder = 10 + i; // Ensure proper transparency rendering

      // Add to feather group
      featherGroup.add(feather);
    }

    // Add feather group to wing
    wing.add(featherGroup);
  }

  setupAnimations() {
    // Animation could be added here in the future
  }
}
