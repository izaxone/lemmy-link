let instanceUrl = "";

const lemmyCommunityRegex = new RegExp(
  `![a-zA-Z]{1,30}@([a-zA-Z0-9\\-ßàÁâãóôþüúðæåïçèõöÿýòäœêëìíøùîûñé]{1,63}\\.){1,127}[a-zA-Z]{2,63}`,
  "gm"
);
const looselemmyCommunityRegex = new RegExp(
  `[a-zA-Z]{1,30}@([a-zA-Z0-9\\-ßàÁâãóôþüúðæåïçèõöÿýòäœêëìíøùîûñé]{1,63}\\.){1,127}[a-zA-Z]{2,63}`,
  "gm"
);
const lemmyCommunityUrlRegex = new RegExp(
  `https?:\\/\\/(?:[a-zA-Z0-9\\-]{1,63}\\.){1,127}[a-zA-Z]{2,63}\\/c\\/[a-zA-Z]{1,30}`,
  "gm"
);

//
const observer = new MutationObserver((mutationList, observer) => {
  for (let mutation of mutationList) {
    if (mutation.target.parentElement !== null) {
      walk(mutation.target.parentElement);
    }
  }
});
const observerConfig = { attributes: false, childList: true, subtree: true };

function walk(node: Node) {
  // I stole this function from here:
  // https://github.com/panicsteve/cloud-to-butt/blob/master/Source/content_script.js

  var child, next;
  if (node instanceof HTMLElement) {
    var tagName = node.tagName ? node.tagName.toLowerCase() : "";
    if (tagName == "input" || tagName == "textarea") {
      return;
    }
    if (node.classList && node.classList.contains("lemmy_linker")) {
      return;
    }
  }
  switch (node.nodeType) {
    case Node.ELEMENT_NODE: // Element
    case Node.DOCUMENT_NODE: // Document
    case Node.DOCUMENT_FRAGMENT_NODE: // Document fragment
      child = node.firstChild;
      while (child) {
        next = child.nextSibling;
        walk(child);
        child = next;
      }
      break;

    case Node.TEXT_NODE: // Text node
      handleText(node);
      break;
  }
}

function handleText(textNode: Node) {
  if (
    isTextNodeWithCommunity(textNode, lemmyCommunityRegex) ||
    (isTextNodeWithCommunity(textNode, looselemmyCommunityRegex) &&
      isParentTextNodeWithCommunity(textNode, lemmyCommunityRegex))
  ) {
    processTextNode(textNode, lemmyCommunityRegex, "mention");
  } else if (isTextNodeWithCommunity(textNode, lemmyCommunityUrlRegex)) {
    processTextNode(textNode, lemmyCommunityUrlRegex, "url");
  }
}

function isTextNodeWithCommunity(textNode: Node, regex: RegExp) {
  return textNode.nodeValue?.match(regex);
}

function isParentTextNodeWithCommunity(textNode: Node, regex: RegExp) {
  return textNode.parentElement?.innerText.match(regex);
}

function processTextNode(
  textNode: Node,
  regex: RegExp,
  type: "mention" | "url"
) {
  const parentElement = textNode.parentElement;
  if (!parentElement) {
    return;
  }

  parentElement.classList.add("lemmy_linker");
  const matches = parentElement.innerHTML.match(regex) || [];

  let newHTML = parentElement.innerHTML;
  for (let match of matches) {
    const linkElement = convertToLemmyUrl(match, type);
    const newText = `${linkElement}&nbsp;${match}`;
    newHTML = newHTML.replace(regex, () => newText);
  }

  parentElement.innerHTML = newHTML;
}

//mention !community@instance.domain
//url https://lemmy.ml/c/memes
function convertToLemmyUrl(input: string, type: "mention" | "url") {
  const baseUrl = `https://${instanceUrl}/`;
  let resultUrl = "";
  switch (type) {
    case "mention":
      const replacement = input.includes(instanceUrl)
        ? input.replace(`@${instanceUrl}`, "")
        : input.replace("!", "");
      resultUrl = `${baseUrl}c/${replacement}`;
      break;
    case "url":
      resultUrl = input.replace(
        /https?:\/\/([^/]+)\/c\/(.+)/,
        `https://${instanceUrl}/c/$2@$1`
      );
      break;
  }
  const linkElement = `<a href="${resultUrl}">
  <img style="height: 0.9em;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAABPlBMVEVHcEz////////////29vZ2dnb8/Pz///////////+enp7///////+np6d8fHxhYWH///+FhYX///9TU1PR0dHp6en////Gxsb9/f38/Pz5+fldXV2mpqa/v7+YmJjHx8fd3d3i4uKTk5Nra2tnZ2e3t7f///////+CgoLu7u7+/v7W1tZZWVm0tLSZmZmvr6/n5+eNjY2MjIzCwsLv7++9vb329vbx8fEjHyj///8jIyMfHx8oKCj6+vr39/fv7++SkpLg4OBOTk4vLy8/Pz8cHBxfX18AAAAsLCwaGhqtra1ubm7z8/Po6Oh2dnYUFBQ5OTn9/f3Hx8cFBQW8vLzV1dWNjY3s7OxWVlZHR0clJSVlZWVFRUXk5OTd3d1cXFzQ0NCoqKh+fn42NjaAgICCgoK0tLQNDQ3AwMCenp42LWJLAAAAOHRSTlMALzghYe9PCwMR2wUc2vH4ROon/Z5zFbU9TFj7zrbarJWA4PX2xg0C7Wo1lPu/6sao6OKyVMFwmS5wkloAAALjSURBVEjH7VXHduJAEASBCCLHJRoMGJwTtvdJM0KgRBI5i2SD4///wAoBtgl6e9vLum4z09Xd6qoZqVQ/+J+gd/oQjUn53KRBfE7919KfvkXRg0jAuD/cGIgcoOht2r9KafIcQ8jWRZhII4u1weg8tet0frvaLCdF0nEo1lkIjz1Lht9RfJkIVCfLMBa7wal1X8XQhC1oix8fhA99eruFYbIdSpi8FB1+uf80fG7gC+R4whI9OGeIQn1Au+jRXCRY6y8Lwefk48YMphcl1Y7CcgPHqSlRB3T2PUcJJEkKvU6pXIDFPrU6zhUcaomgs9HkmjB845sZ/BsaUiODdT6Stuk2CNQQfGyEy2gz9HiDoHbAyXKjy5XwPWiK1WXGCZRb0kcKy42OuPr4bWRBUy5QLUTkOdtvit1FJ8+fH7+FSr0sZcp0izd2WYfUiZXjm6TAlnEFzOYU2eQ560lqJbUWq4P+jHtSIrxy1T6oY9ovt6nPYi5QayrENx5rwBU7U2/Y0flwCR6VKnSIywfntpmNIUKR8EiEdo2cvCDeF4fC+Jt2mbEga0dc6HcIKXchu/DLVBxW1vG9MpwuRt1lzlK710R7Tkvpuvl863NapVY+35UsMwoG9twrDQZeJVW3CVLZJxAy7yF4rwdsBR/zhXJvTaCqzHCM5+b938mdcKfnKs7lywKeqUjGEtrZbFtqkKxkcIrPQ2tY693q54iugaAVVOXLMp5yDMPxsqt7Q8JKFwHv3pyTGmOlLNoY4CWrk2VYqlRKYlmq1XGJmNZzER/dbyphupOuu0oVuHxjnoQczMquhjnqA75ZpJvv1R36tlRYjRatsYCecW1ZrmJ1BEY1VKv8wCFYLXEdcnGtZYUWOL+6TtQwRCneGIasO6nxHLngK0WVxOD9iTnpZmFY4UVUmS2DI81CEbfk/jkIRr3y/AYWswLBcBc9XWp4iKFoyLNMfBq9M/z9OTcjiFmV+vmt/TP8AerX2LHBpUz5AAAAAElFTkSuQmCC" alt="${input}">
</a>`;
  return linkElement;
}

// @ts-ignore
function restore_options(): void {
  chrome.storage.sync.get(
    {
      instance: "lemmy.world",
    },
    function (items) {
      instanceUrl = items.instance;
      // Don't run on own server
      if (!location.href.startsWith(`${location.protocol}//${instanceUrl}`)) {
        walk(document.body);
        observer.observe(document.body, observerConfig);
      }
    }
  );
}

restore_options();