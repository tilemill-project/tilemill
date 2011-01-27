PROJECT_NAME='tipsy'
PROJECT_VERSION='1.0.0a'
MANIFEST=%w(src LICENSE README)

def project_tag
  "#{PROJECT_NAME}-#{PROJECT_VERSION}"
end

def target
  File.join('pkg', project_tag)
end

task :clean do
  `rm -rf pkg`
end

task :docs do
  `cd docs && project-kit --target=archive build src build`
end

task :build => :clean do
  `mkdir -p #{target}`
  `cd docs && project-kit --target=archive build src build`
  `mv docs/build #{target}/docs`
  MANIFEST.each { |e| `cp -R #{e} #{target}/` }
end

task :package => :build do
  `cd pkg && zip -ro ../#{project_tag}.zip #{project_tag}`
end
