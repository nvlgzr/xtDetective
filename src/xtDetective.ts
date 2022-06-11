type Model = {
  originallyEnabled: string[],
  originallyDisabled: string[],
  untested: string[],
  toTest: string[],
  passed: string[],
  underSuspicion: string[],
}

function start(): Model {
  const current = readTheDOM();
  const originallyEnabled: string[] = current
    ? current.filter(isEnabled).map(extensionName)
    : []
  const originallyDisabled: string[] = current
    ? current.filter(e => !isEnabled(e)).map(extensionName)
    : []

  const [nextUp, later] = split(originallyEnabled)

  console.group('Disabling…')
  console.log(later.join())
  console.groupEnd()

  console.group('Testing…')
  console.log(nextUp.join())
  console.groupEnd()

  disableAll(later)

  return {
    originallyEnabled,
    originallyDisabled,
    untested: later,
    toTest: nextUp,
    passed: [],
    underSuspicion: [],
  }
}

function reset(model): void {
  for (let name of model.originallyDisabled) {
    this.disable(name);
  }

  for (let name of model.originallyEnabled) {
    this.enable(name);
  }
}

function pass(model: Model): Model | void {
  let noMoreToTest = model.untested.length === 0 && model.underSuspicion.length === 0

  if (noMoreToTest) {

    console.log(`✅✅✅ All extensions passed`)
    return model

  } else {
    const {
      originallyEnabled,
      originallyDisabled,
      untested,
      toTest,
      passed,
      underSuspicion
    } = model
    const done = [...passed, ...toTest]

    if (underSuspicion.length) {

      enableAll(underSuspicion)

      return {
        originallyEnabled,
        originallyDisabled,
        untested,
        toTest: underSuspicion,
        passed: done,
        underSuspicion: []
      }
    } else {

      // Move ½ of untested to toTest, unless there's something waiting
      // in underSuspicion…in which case, underSuspicion ⇒ toTeest
      const [nextUp, later] = split(untested)

      enableAll(nextUp)

      return {
        originallyEnabled,
        originallyDisabled,
        untested: later,
        toTest: nextUp,
        passed: done,
        underSuspicion
      }
    }
  }
}

function fail(model: Model): Model | void {
  let foundIt = model.toTest.length === 1

  if (foundIt) {
    console.log(`🏁 Looks like this extension is causing you trouble: ${model.toTest[0]} 💥`)
    return model

  } else {
    // Move ½ of atoTest to underSuspicion
    const {
      originallyEnabled,
      originallyDisabled,
      untested,
      toTest,
      passed,
      underSuspicion
    } = model
    const [nextUp, later] = split(toTest)

    console.log(`Tabling testing on these for now: ${later}`)

    disableAll(later)

    return {
      originallyEnabled,
      originallyDisabled,
      untested: untested,
      toTest: nextUp,
      passed,
      underSuspicion: [...underSuspicion, ...later]
    }
  }
}

function allOn() {
  enableAll(readTheDOM().map(extensionName))
}

function allOff() {
  disableAll(readTheDOM().map(extensionName))
}

// --------------------------------------------------------------- //

function split(names: string[]): [string[], string[]] {
  const mid = Math.ceil(names.length / 2)
  return [names.slice(0, mid), names.slice(mid)]
}

function readTheDOM(): HTMLElement[] | null {
  const dom = document?.querySelector("extensions-manager")?.shadowRoot?.querySelector("extensions-item-list")?.shadowRoot?.querySelectorAll("extensions-item") as NodeListOf<HTMLElement> | undefined
  return dom ? Array.from(dom) : null;
}

function extensionName(node: HTMLElement): string {
  const root = node.shadowRoot;
  return root?.querySelector("#name")?.textContent ?? 'NO NAME FOUND';
}

function isEnabled(node) {
  const root = node.shadowRoot;
  const toggle = root.querySelector("cr-toggle");
  return toggle.__data.checked;
}

function disableAll(names: string[]) {
  for (let name of names) {
    disable(name)
  }
}

function enableAll(names: string[]) {
  for (let name of names) {
    enable(name)
  }
}

function enable(name) {
  const currentlyDisabled = () => {
    return readTheDOM().filter((node) => !isEnabled(node));
  }

  for (let node of currentlyDisabled()) {
    if (extensionName(node) === name && !isEnabled(node)) {
      console.log(`✅ Enabling ${name}`);
      let toggle = node.shadowRoot.querySelector("cr-toggle") as HTMLElement
      toggle.click();
    } else {
      // console.log(`${name} already enabled`);
    }
  }
}

function disable(name) {
  for (let node of readTheDOM()) {
    if (extensionName(node) === name && isEnabled(node)) {
      console.log(`◻️ Disabling ${name}`);
      const toggle = node.shadowRoot.querySelector("cr-toggle") as HTMLElement
      toggle.click();
    } else {
      // console.log(`${name} already disabled`);
    }
  }
}
