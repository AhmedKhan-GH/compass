library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        status : in std_logic_vector(7 downto 0);
        mask : in std_logic_vector(7 downto 0);
        inverted : out std_logic_vector(7 downto 0);
        kept : out std_logic_vector(7 downto 0);
        toggled : out std_logic_vector(7 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    inverted <= not status;
    kept <= status and mask;
    toggled <= status xor (status'range => mask(0));
end architecture;
