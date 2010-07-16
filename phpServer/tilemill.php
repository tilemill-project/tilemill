<?php

/**
 * Main bootstrap function. Inits configuration and routes requests to
 * respective request handlers.
 */
function main($path, $args, $method = 'get') {
  $config = array('files' => dirname(__FILE__));
  if (file_exists('tilemill.cfg')) {
    $config = array_merge($config, parse_ini_file('tilemill.cfg'));
  }

  switch ($path) {
    case '':
      $handler = new InfoHandler($config, $path, $args);
      return $handler->{$method}();
    case 'list':
      $handler = new ListHandler($config, $path, $args);
      return $handler->{$method}();
    case 'add':
      $handler = new AddHandler($config, $path, $args);
      return $handler->{$method}();
    case 'file':
      $handler = new FileHandler($config, $path, $args);
      return $handler->{$method}();
    default:
      $handler = new NotFoundHandler($config, $path, $args);
      return $handler->{$method}();
  }
}

/**
 * Base request handler class.
 */
class RequestHandler {
  var $config;
  var $path;
  var $args;

  function __construct($config, $path, $args) {
    $this->config = $config;
    $this->path = $path;
    $this->args = $args;
  }

  function get() {
    header('HTTP/1.1 200 OK');
    header('Connection: close');
    return;
  }

  function post() {
    header('HTTP/1.1 200 OK');
    header('Connection: close');
    return;
  }

  function json($data, $force_json = TRUE) {
    if (isset($this->args['jsoncallback'])) {
      header('Content-Type: text/javascript');
      $json = json_encode($data);
      return "{$this->args['jsoncallback']}({$json})";
    }
    elseif ($force_json) {
      return json_encode($data);
    }
    return $data;
  }

  function safePath($path) {
    return strpos($path, '..') === FALSE && !preg_match('/[^\w+\/._-]/', $path);
  }
}

/**
 * Info handler class.
 * @TODO: determine what other information we need to provide.
 */
Class InfoHandler extends RequestHandler {
  function get() {
    parent::get();
    return $this->json(array(
      'api' => 'basic',
      'version' => 1.0,
    ));
  }
}

/**
 * 404 handler class.
 */
class NotFoundHandler extends RequestHandler {
  function get() {
    header('HTTP/1.1 404 Not Found');
    header('Connection: close');
    return;
  }
  function post() {
    header('HTTP/1.1 404 Not Found');
    header('Connection: close');
    return;
  }
}

/**
 * List handler class.
 */
class ListHandler extends RequestHandler {
  function get() {
    parent::get();
    if (isset($this->args['filename'])) {
      $path = "{$this->config['files']}/{$this->args['filename']}";
      if ($this->safePath($path)) {
        if (file_exists($path) && is_dir($path) && $handle = opendir($path)) {
          $directories = array();
          while (FALSE !== ($file = readdir($handle))) {
            $basename = basename($file);
            if (file_exists("{$path}/{$file}/{$basename}.mml") && is_file("{$path}/{$file}/{$basename}.mml")) {
              $directories[] = $basename;
            }
          }
          return $this->json(array('status' => TRUE, 'data' => $directories));
        }
        return $this->json(array('status' => FALSE, 'data' => 'The file could not be found'));
      }
    }
    return $this->json(array('status' => FALSE, 'data' => 'Invalid filename'));
  }
}

/**
 * Add handler class.
 */
class AddHandler extends RequestHandler {
  function post() {
    parent::post();
    if (isset($this->args['filename'])) {
      $path = "{$this->config['files']}/{$this->args['filename']}";
      if ($this->safePath($path)) {
        if (!file_exists($path)) {
          mkdir($path);
          return $this->json(array('status' => TRUE), TRUE);
        }
        return $this->json(array('status' => FALSE, 'data' => "The directory {$path} already exists"));
      }
    }
    return $this->json(array('status' => FALSE, 'data' => 'Invalid filename'));
  }
}

/**
 * File handler class.
 */
class FileHandler extends RequestHandler {
  function get() {
    parent::get();
    if (isset($this->args['filename'])) {
      $path = "{$this->config['files']}/{$this->args['filename']}";
      if ($this->safePath($path)) {
        if (file_exists($path) && is_file($path)) {
          $data = file_get_contents($path);
          return $this->json($data, FALSE);
        }
        return $this->json(array('status' => FALSE, 'data' => 'The file could not be found'));
      }
    }
    return $this->json(array('status' => FALSE, 'data' => 'Invalid filename'));
  }
  function post() {
    parent::post();
    if (isset($this->args['filename'])) {
      $path = "{$this->config['files']}/{$this->args['filename']}";
      if ($this->safePath($path)) {
        // Create paths in between.
        if (!file_exists(dirname($path))) {
          mkdir(dirname($path), 0777, TRUE);
        }
        // Write file.
        if (file_exists(dirname($path)) && is_dir(dirname($path))) {
          file_put_contents($path, $this->args['data']);
          return $this->json(array('status' => TRUE));
        }
        return $this->json(array('status' => FALSE, 'data' => "Could not write file"));
      }
    }
    return $this->json(array('status' => FALSE, 'data' => 'Invalid filename'));
  }
}

$method = strtolower($_SERVER['REQUEST_METHOD']);
$args = $method === 'post' ? $_POST : $_GET;
print main($_GET['q'], array_diff_key($args, array('q' => NULL)), $method);
exit;
